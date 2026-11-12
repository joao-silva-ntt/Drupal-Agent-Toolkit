"""Portable QA runner tests; no running site or external network required."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import qa
import seo_audit


BASE = "https://site.test"
VALID_HTML = """<!doctype html><html lang="en"><head>
<title>A descriptive page title</title>
<meta name="description" content="A useful description of the page and its contents, written for visitors rather than search engines.">
<link rel="canonical" href="https://site.test/">
</head><body><main><h1>A page</h1></main></body></html>"""


def parse(markup=VALID_HTML):
    page = seo_audit.Page()
    page.feed(markup)
    return page


class PageChecksTest(unittest.TestCase):
    def codes(self, markup, path="/", expected=None, sitemap=True):
        return {item["code"] for item in seo_audit.check_page(BASE, path, parse(markup), {}, expected, sitemap)}

    def test_valid_page(self):
        self.assertEqual(self.codes(VALID_HTML), set())

    def test_missing_and_multiple_canonicals(self):
        self.assertIn("canonical-count", self.codes(VALID_HTML.replace('rel="canonical"', 'rel="other"')))
        self.assertIn("canonical-count", self.codes(VALID_HTML + '<link rel="canonical" href="/">'))

    def test_external_canonical(self):
        self.assertIn("canonical-origin", self.codes(VALID_HTML.replace('href="https://site.test/"', 'href="https://other.test/"')))

    def test_pagination_must_be_preserved(self):
        self.assertIn("canonical-target", self.codes(VALID_HTML, "/?page=1"))
        self.assertNotIn("canonical-target", self.codes(VALID_HTML.replace('href="https://site.test/"', 'href="https://site.test/?page=1"'), "/?page=1"))

    def test_explicit_zero_page_normalization(self):
        findings = seo_audit.check_page(BASE, "/?page=0", parse(), {"canonical_omit_zero_page": True})
        self.assertNotIn("canonical-target", {item["code"] for item in findings})
        findings = seo_audit.check_page(BASE, "/?page=1", parse(), {"canonical_omit_zero_page": True})
        self.assertIn("canonical-target", {item["code"] for item in findings})

    def test_indexing_and_language_contracts(self):
        noindex = VALID_HTML + '<meta name="robots" content="noindex, follow">'
        self.assertIn("indexable-noindex", self.codes(noindex))
        self.assertNotIn("indexable-noindex", self.codes(noindex, expected={"indexable": False}, sitemap=False))
        self.assertIn("missing-noindex", self.codes(VALID_HTML, expected={"indexable": False}, sitemap=False))
        self.assertIn("language", self.codes(VALID_HTML, expected={"language": "pt"}))

    def test_missing_description_is_warning(self):
        results = seo_audit.check_page(BASE, "/", parse(VALID_HTML.replace('name="description"', 'name="other"')), {})
        self.assertEqual(next(item["level"] for item in results if item["code"] == "description"), "warning")

    def test_placeholder_vs_legitimate_google_maps(self):
        markup = VALID_HTML + '<a href="https://example.com/tickets">Book</a><a href="https://google.com">Book</a><a href="https://google.com/maps">Map</a>'
        results = seo_audit.check_page(BASE, "/", parse(markup), {})
        self.assertEqual(sum(item["code"] == "placeholder-link" for item in results), 1)
        self.assertEqual(sum(item["code"] == "generic-google-link" for item in results), 1)

    def test_schema_validation(self):
        markup = VALID_HTML + '<script type="application/ld+json">{"@graph":[{"@type":"Event","name":"Real Event"}]}</script>'
        self.assertTrue({"event-image", "event-startdate", "event-location"} <= self.codes(markup))
        self.assertIn("invalid-jsonld", self.codes(VALID_HTML + '<script type="application/ld+json">{bad}</script>'))
        self.assertIn("schema-type", self.codes(VALID_HTML, expected={"schema_types": ["Organization"]}))

    def test_hreflang_contract(self):
        self.assertIn("hreflang", self.codes(VALID_HTML, expected={"hreflang": ["en", "pt"]}))
        markup = VALID_HTML + '<link rel="alternate" hreflang="pt" href="https://elsewhere.test/pt">'
        self.assertIn("hreflang-origin", self.codes(markup, expected={"hreflang": ["pt"]}))


class TargetSafetyTest(unittest.TestCase):
    def test_origin_normalization(self):
        self.assertEqual(seo_audit.origin("https://SITE.test"), seo_audit.origin("https://site.test:443/"))

    def test_invalid_targets(self):
        for value in ("file:///etc/passwd", "https://user:password@site.test", "javascript:alert(1)"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                seo_audit.origin(value)

    def test_external_links_and_redirects_refused(self):
        with self.assertRaises(ValueError):
            seo_audit.local_url(BASE, "//elsewhere.test/private")
        handler = seo_audit.SameOriginRedirect(BASE)
        with self.assertRaises(ValueError):
            handler.redirect_request(None, None, 301, "", {}, "https://elsewhere.test/")

    def test_profile_requires_explicit_approved_origin(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "profile.json"
            path.write_text(json.dumps({"schema_version": 1, "qa": {"allowed_origins": [BASE]}}))
            self.assertEqual(qa.load_profile(path, BASE)["schema_version"], 1)
            for value in ("https://other.test", BASE + "/subpath", BASE + "?query=x"):
                with self.subTest(value=value), self.assertRaises(ValueError):
                    qa.load_profile(path, value)

    def test_conflicting_environment_blocks_without_disclosing_value(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(qa, "ROOT", Path(directory)):
            (Path(directory) / ".env").write_text('PASSWORD=do-not-log\nBASE_URL="https://other.test"\n')
            with self.assertRaisesRegex(ValueError, "different target") as error:
                qa.check_environment({"env_files": [".env"]}, BASE)
            self.assertNotIn("do-not-log", str(error.exception))
            (Path(directory) / ".env").write_text(f"BASE_URL='{BASE}'\n")
            qa.check_environment({"env_files": [".env"]}, BASE)

    def test_working_directory_cannot_escape_repository(self):
        with self.assertRaises(ValueError):
            qa.workspace_path("../")


class RunnerTest(unittest.TestCase):
    def test_local_database_command_cannot_run_for_different_target(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(qa.subprocess, "run") as run:
                with self.assertRaisesRegex(ValueError, "not approved"):
                    qa.command_result({"argv": ["drush"], "allowed_origins": ["https://local.test"]}, BASE, Path(directory), 1, 10)
                run.assert_not_called()

    def test_disabled_suite_is_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = {"qa": {"seo": {"enabled": False}}}
            result = qa.run(profile, BASE, ("seo",), Path(directory))
            self.assertEqual(result, 2)
            self.assertEqual(json.loads((Path(directory) / "summary.json").read_text())["status"], "blocked")

    def test_command_is_argv_and_target_is_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            process = subprocess.CompletedProcess([], 0, "OK")
            with patch.object(qa.subprocess, "run", return_value=process) as run:
                result = qa.command_result({"cwd": ".", "argv": ["test-tool", "{base_url}", "{output_dir}"]}, BASE, Path(directory), 1, 10)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(run.call_args.args[0], ["test-tool", BASE, directory])
            self.assertEqual(run.call_args.kwargs["env"]["BASE_URL"], BASE)
            self.assertNotIn("shell", run.call_args.kwargs)

    def test_missing_executable_and_timeout_are_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            for error in (FileNotFoundError("missing"), subprocess.TimeoutExpired("test-tool", 1)):
                with patch.object(qa.subprocess, "run", side_effect=error):
                    result = qa.command_result({"argv": ["test-tool"]}, BASE, Path(directory), 1, 1)
                    self.assertEqual(result["status"], "blocked")

    def test_playwright_empty_or_invalid_report_is_not_success(self):
        with tempfile.TemporaryDirectory() as directory:
            for stdout in ('{"stats":{"expected":0,"skipped":4}}', "no report"):
                with patch.object(qa.subprocess, "run", return_value=subprocess.CompletedProcess([], 0, stdout)):
                    result = qa.command_result({"argv": ["test-tool"], "report_format": "playwright-json"}, BASE, Path(directory), 1, 10)
                    self.assertEqual(result["status"], "blocked")

    def test_playwright_pass_and_failed_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            for unexpected, expected_status in ((0, "passed"), (1, "failed")):
                stdout = json.dumps({"stats": {"expected": 4, "unexpected": unexpected, "skipped": 2}, "config": {"version": "1.0"}})
                with patch.object(qa.subprocess, "run", return_value=subprocess.CompletedProcess([], int(bool(unexpected)), stdout)):
                    result = qa.command_result({"argv": ["test-tool"], "report_format": "playwright-json"}, BASE, Path(directory), 1, 10)
                    self.assertEqual(result["status"], expected_status)
                    self.assertEqual(result["stats"]["skipped"], 2)

    def test_partial_browser_run_with_missing_browser_stays_blocked(self):
        stdout = json.dumps({"stats": {"expected": 4, "unexpected": 2}, "errors": ["Executable doesn't exist"]})
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(qa.subprocess, "run", return_value=subprocess.CompletedProcess([], 1, stdout)):
                result = qa.command_result({"argv": ["test-tool"], "report_format": "playwright-json"}, BASE, Path(directory), 1, 10)
                self.assertEqual(result["status"], "blocked")

    def test_structured_editorial_findings_are_preserved(self):
        stdout = json.dumps({"status": "failed", "findings": [{"level": "failure", "code": "placeholder"}], "counts": {"records": 10}})
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(qa.subprocess, "run", return_value=subprocess.CompletedProcess([], 0, stdout)):
                result = qa.command_result({"argv": ["test-tool"], "report_format": "findings-json"}, BASE, Path(directory), 1, 10)
                self.assertEqual(result["status"], "failed")
                self.assertEqual(result["counts"]["records"], 10)
                self.assertEqual(result["findings"][0]["code"], "placeholder")


class CrawlTest(unittest.TestCase):
    def fake_fetch(self, markup, sitemap_body=None):
        class Response:
            status = 200
            url = BASE
            headers = {"Content-Type": "text/html"}

            def __init__(self, request):
                self.request = request

            def __enter__(self):
                self.url = self.request.full_url
                return self

            def __exit__(self, *args):
                return False

            def read(self, size):
                return (sitemap_body if self.request.full_url.endswith(".xml") else markup).encode()

        class Opener:
            def open(self, request, timeout):
                return Response(request)

        return Opener()

    def test_page_limit_reports_incomplete_coverage(self):
        with patch.object(seo_audit.urllib.request, "build_opener", return_value=self.fake_fetch(VALID_HTML)):
            result = seo_audit.audit(BASE, {"pages": [{"path": "/"}, {"path": "/other"}], "max_pages": 1})
        self.assertEqual(result["status"], "blocked")
        self.assertIn("Page limit", result["blocked"][0])

    def test_sitemap_does_not_crawl_image_locations(self):
        sitemap = f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>{BASE}/</loc><image:image><image:loc>https://outside.test/image.jpg</image:loc></image:image></url></urlset>'
        with patch.object(seo_audit.urllib.request, "build_opener", return_value=self.fake_fetch(VALID_HTML, sitemap)):
            result = seo_audit.audit(BASE, {"sitemap": "/sitemap.xml"})
        self.assertEqual(result["pages_checked"], 1)
        self.assertEqual(result["status"], "passed")

    def test_external_sitemap_origin_is_blocked(self):
        sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://other.test/</loc></url></urlset>'
        with patch.object(seo_audit.urllib.request, "build_opener", return_value=self.fake_fetch(VALID_HTML, sitemap)):
            result = seo_audit.audit(BASE, {"sitemap": "/sitemap.xml"})
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["pages_checked"], 0)


if __name__ == "__main__":
    unittest.main()
