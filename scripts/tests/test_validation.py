import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("validator", Path(__file__).resolve().parents[1] / "validate_toolkit.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ValidationTest(unittest.TestCase):
    def test_broken_metadata_links_and_project_paths_are_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "plugin.json").write_text(json.dumps({"name": "toolkit", "version": "0.3.0"}))
            agent = Path("com.github.copilot/agents/test.agent.md")
            (root / agent).parent.mkdir(parents=True)
            (root / agent).write_text("---\nname: Test\ndescription: Test\ntools: [read, unknown]\n---\n[Missing](missing.md)\n/home/private/project/\n")
            errors = validator.validate(root, [agent])
            self.assertTrue(any("tool declarations" in error for error in errors))
            self.assertTrue(any("broken local link" in error for error in errors))
            self.assertTrue(any("project-specific" in error for error in errors))
            self.assertTrue(any("readiness reference" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
