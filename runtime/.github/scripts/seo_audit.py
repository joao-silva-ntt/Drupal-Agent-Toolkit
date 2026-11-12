#!/usr/bin/env python3
"""Portable same-origin HTTP SEO checks. No external service or dependencies."""

import collections
import concurrent.futures
import html
from html.parser import HTMLParser
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def origin(url):
    value = urllib.parse.urlsplit(url)
    if value.scheme not in ("http", "https") or not value.hostname or value.username or value.password:
        raise ValueError("An HTTP(S) URL without embedded credentials is required.")
    port = value.port or (443 if value.scheme == "https" else 80)
    return value.scheme.lower(), value.hostname.lower(), port


def local_url(base, path):
    url = urllib.parse.urljoin(base + "/", path)
    if origin(url) != origin(base):
        raise ValueError("Cross-origin URL refused: " + url)
    return urllib.parse.urldefrag(url)[0]


def clean(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
    def __init__(self, base):
        super().__init__()
        self.base = base

    def redirect_request(self, request, fp, code, message, headers, new_url):
        local_url(self.base, new_url)
        return super().redirect_request(request, fp, code, message, headers, new_url)


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title = ""
        self.lang = ""
        self.descriptions = []
        self.canonicals = []
        self.alternates = []
        self.robots = []
        self.links = []
        self.schema = []
        self.schema_errors = []
        self.json_script = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang", "")
        elif tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = attrs.get("name", "").lower()
            if name == "description":
                self.descriptions.append(attrs.get("content", ""))
            if name in ("robots", "googlebot"):
                self.robots.append(attrs.get("content", "").lower())
        elif tag == "link":
            rel = attrs.get("rel", "").split()
            if "canonical" in rel:
                self.canonicals.append(attrs.get("href", ""))
            if "alternate" in rel and attrs.get("hreflang"):
                self.alternates.append(attrs)
        elif tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        elif tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_script = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.json_script is not None:
            try:
                data = json.loads(self.json_script)
                self.schema.extend(data if isinstance(data, list) else [data])
            except json.JSONDecodeError as error:
                self.schema_errors.append(str(error))
            self.json_script = None

    def handle_data(self, text):
        if self.in_title:
            self.title += text
        if self.json_script is not None:
            self.json_script += text


def schema_objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from schema_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from schema_objects(child)


def check_page(base, path, page, settings, expected=None, in_sitemap=False):
    expected = expected or {}
    findings = []

    def add(level, code, evidence, suggestion):
        findings.append(dict(level=level, code=code, url=base + path, evidence=evidence, suggestion=suggestion))

    if not clean(page.title):
        add("failure", "missing-title", "Rendered title is empty.", "Add a unique descriptive title.")
    if len(page.canonicals) != 1:
        add("failure", "canonical-count", f"{len(page.canonicals)} canonicals found.", "Render exactly one canonical.")
    else:
        try:
            canonical = local_url(base, page.canonicals[0])
            actual = urllib.parse.urlsplit(canonical)
            wanted = urllib.parse.urlsplit(local_url(base, expected.get("canonical_path", path)))
            if settings.get("canonical_omit_zero_page") and "canonical_path" not in expected:
                pairs = urllib.parse.parse_qsl(wanted.query, keep_blank_values=True)
                pairs = [(key, value) for key, value in pairs if not (key == "page" and re.fullmatch(r"0+(?:,0+)*", value))]
                wanted = wanted._replace(query=urllib.parse.urlencode(pairs))
            if actual.path.rstrip("/") != wanted.path.rstrip("/") or actual.query != wanted.query:
                add("failure", "canonical-target", canonical, "Verify language, alias and pagination canonical; configure intentional exceptions explicitly.")
            if not urllib.parse.urlsplit(page.canonicals[0]).netloc:
                add("warning", "relative-canonical", page.canonicals[0], "Prefer an absolute canonical URL.")
        except ValueError as error:
            add("failure", "canonical-origin", str(error), "Use the approved target origin.")
    directives = {part.strip() for value in page.robots for part in value.split(",")}
    noindex = bool(directives & {"noindex", "none"})
    if (in_sitemap or expected.get("indexable") is True) and noindex:
        add("failure", "indexable-noindex", "Expected indexable page contains noindex.", "Check environment and page robots configuration.")
    if expected.get("indexable") is False and not noindex:
        add("failure", "missing-noindex", "Configured utility page has no noindex.", "Restore its intended robots policy.")
    if expected.get("language") and page.lang != expected["language"]:
        add("failure", "language", f"Expected {expected['language']}, found {page.lang}.", "Verify route language and HTML lang.")
    if len(page.descriptions) != 1 or not clean(page.descriptions[0]):
        add("warning", "description", "Missing, empty or multiple meta descriptions.", "Write one accurate page-specific summary.")
    elif "?" not in path:
        limits = settings.get("description_review_characters", [70, 180])
        length = len(clean(page.descriptions[0]))
        if not limits[0] <= length <= limits[1]:
            add("warning", "description-length", f"{length} characters; review range {limits}.", "Review preview clarity; these are heuristics, not ranking limits.")
    if len(clean(page.title)) > settings.get("title_review_characters", 70) and "?" not in path:
        add("warning", "title-length", f"{len(clean(page.title))} characters.", "Consider a concise metadata override without changing the visible headline or URL.")
    for language in expected.get("hreflang", []):
        alternatives = [item for item in page.alternates if item.get("hreflang") == language]
        if len(alternatives) != 1:
            add("failure", "hreflang", f"Expected one {language} alternate, found {len(alternatives)}.", "Verify translated landing-page alternates.")
        for item in alternatives:
            try:
                local_url(base, item.get("href", ""))
            except ValueError as error:
                add("failure", "hreflang-origin", str(error), "Use the approved target origin.")
    objects = list(schema_objects(page.schema))
    types = set()
    for item in objects:
        item_types = item.get("@type", [])
        types.update(item_types if isinstance(item_types, list) else [item_types])
    for error in page.schema_errors:
        add("failure", "invalid-jsonld", error, "Correct JSON-LD serialization.")
    for required in expected.get("schema_types", []):
        if required not in types:
            add("failure", "schema-type", f"Missing {required}.", "Check configured structured data.")
    for item in objects:
        if item.get("@type") == "Event":
            for key in ("image", "startDate", "location"):
                if not item.get(key):
                    add("warning", "event-" + key.lower(), f"Event schema has no {key}.", "Confirm the underlying Event field; do not invent facts.")
    for href in sorted(set(page.links)):
        host = (urllib.parse.urlsplit(urllib.parse.urljoin(base + path, href)).hostname or "").lower()
        if host in ("example.com", "www.example.com", "example.org", "www.example.org", "example.net", "www.example.net"):
            add("failure", "placeholder-link", href, "Replace with a verified destination or remove the placeholder after approval.")
        elif host in ("google.com", "www.google.com") and urllib.parse.urlsplit(href).path in ("", "/"):
            add("warning", "generic-google-link", href, "Check whether this is an accidental booking/link placeholder.")
    return findings


def audit(base, settings):
    findings = []
    blocked = []
    pages = {}
    sitemap_paths = set()
    expectations = {item["path"]: item for item in settings.get("pages", [])}
    timeout = settings.get("timeout_seconds", 30)

    def fetch(path):
        opener = urllib.request.build_opener(SameOriginRedirect(base))
        request = urllib.request.Request(local_url(base, path), headers={"User-Agent": "Drupal-Toolkit-QA/1.0"})
        with opener.open(request, timeout=timeout) as response:
            body = response.read(8 * 1024 * 1024 + 1)
            if len(body) > 8 * 1024 * 1024:
                raise ValueError("Response exceeds the 8 MiB audit limit.")
            return response.status, response.url, response.headers, body

    sitemap_queue = [settings["sitemap"]] if settings.get("sitemap") else []
    visited = set()
    while sitemap_queue:
        path = sitemap_queue.pop(0)
        if path in visited:
            continue
        if len(visited) >= settings.get("max_sitemaps", 10):
            blocked.append("Sitemap limit reached; coverage incomplete.")
            break
        visited.add(path)
        try:
            _, _, _, body = fetch(path)
            root = ET.fromstring(body)
            namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            if root.tag.endswith("sitemapindex"):
                locations = root.findall("s:sitemap/s:loc", namespace)
            elif root.tag.endswith("urlset"):
                locations = root.findall("s:url/s:loc", namespace)
            else:
                raise ValueError("Unsupported sitemap XML root.")
            for location in locations:
                source_url = urllib.parse.urljoin(base + "/", location.text or "")
                allowed_origins = [base] + settings.get("sitemap_origins", [])
                if origin(source_url) not in [origin(item) for item in allowed_origins]:
                    raise ValueError("Unapproved sitemap location origin: " + source_url)
                url = urllib.parse.urlsplit(source_url)
                target = url.path + ("?" + url.query if url.query else "")
                if root.tag.endswith("sitemapindex"):
                    sitemap_queue.append(target)
                else:
                    sitemap_paths.add(target)
        except (OSError, ValueError, ET.ParseError) as error:
            blocked.append(f"Sitemap {path}: {error}")
    todo = set(expectations) | sitemap_paths
    if not todo:
        blocked.append("No page targets configured or discovered.")
    max_pages = settings.get("max_pages", 300)
    attempts = 0

    def read_page(path):
        try:
            status, final, headers, body = fetch(path)
            if "text/html" not in headers.get("Content-Type", ""):
                raise ValueError("Expected text/html.")
            page = Page()
            page.feed(body.decode("utf-8"))
            page.robots.append(headers.get("X-Robots-Tag", "").lower())
            return path, page, final, None
        except (OSError, ValueError, UnicodeError) as error:
            return path, None, None, str(error)

    while todo:
        remaining = max_pages - attempts
        if remaining <= 0:
            blocked.append("Page limit reached; coverage incomplete.")
            break
        batch = sorted(todo)[:remaining]
        if len(batch) < len(todo):
            blocked.append("Page limit reached; coverage incomplete.")
        todo = set()
        attempts += len(batch)
        with concurrent.futures.ThreadPoolExecutor(max_workers=settings.get("workers", 3)) as pool:
            results = list(pool.map(read_page, batch))
        for path, page, final, error in results:
            if error:
                findings.append(dict(level="failure", code="page-response", url=base + path, evidence=error, suggestion="Verify response, routing and availability."))
                pages[path] = None
                continue
            pages[path] = page
            final_url = urllib.parse.urlsplit(final)
            final_path = final_url.path + ("?" + final_url.query if final_url.query else "")
            if path in sitemap_paths and final_path != path:
                findings.append(dict(level="warning", code="sitemap-redirect", url=base + path, evidence=final, suggestion="Prefer canonical final destinations in the sitemap."))
            findings.extend(check_page(base, final_path, page, settings, expectations.get(path), path in sitemap_paths))
            for href in page.links:
                try:
                    url = urllib.parse.urlsplit(local_url(base, urllib.parse.urljoin(final, href)))
                except ValueError:
                    continue
                query = urllib.parse.parse_qs(url.query)
                pager = query.get("page", [""])[0]
                if re.fullmatch(r"[0-9]+(?:,[0-9]+)*", pager):
                    target = url.path + "?" + urllib.parse.urlencode({"page": pager})
                    if target not in pages:
                        todo.add(target)
        todo.difference_update(pages)
    for attr, code in (("title", "duplicate-title"), ("descriptions", "duplicate-description")):
        groups = collections.defaultdict(list)
        for path, page in pages.items():
            if page is None or "?" in path:
                continue
            value = clean(page.title if attr == "title" else " ".join(page.descriptions))
            if value:
                groups[(page.lang, value.casefold())].append(path)
        for paths in groups.values():
            if len(paths) > 1:
                findings.append(dict(level="warning", code=code, url=base + paths[0], evidence=", ".join(paths), suggestion="Review same-language duplication; aliases may intentionally share metadata."))
    failures = sum(item["level"] == "failure" for item in findings)
    return {
        "status": "blocked" if blocked else ("failed" if failures else "passed"),
        "target": base, "sitemap_urls": len(sitemap_paths), "pages_checked": len(pages),
        "failures": failures, "warnings": len(findings) - failures,
        "blocked": blocked, "findings": findings,
        "limitations": [
            "Same-origin sitemap/configured-page HTTP scan with linked pagination; not every possible filter URL or local link is fetched.",
            "Metadata lengths are editorial review heuristics. HTML/JSON-LD do not prove stored-field or translation completeness.",
            "External destinations are inspected as strings only, never fetched. Production indexing and editorial truth require human review.",
        ],
    }
