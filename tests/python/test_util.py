from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


def load_util_module():
    root = Path(__file__).resolve().parents[2]
    module_path = root / "custom_components" / "floormap" / "util.py"
    spec = importlib.util.spec_from_file_location("floormap_util", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


util = load_util_module()


class NormalizePlacementsTest(unittest.TestCase):
    def test_normalize_placements_clamps_values(self) -> None:
        placements = util.normalize_placements(
            [
                {
                    "entity_id": "light.kitchen",
                    "x": 1.5,
                    "y": -0.2,
                    "show_state": 1,
                }
            ]
        )
        self.assertEqual(placements[0]["x"], 1.0)
        self.assertEqual(placements[0]["y"], 0.0)
        self.assertTrue(placements[0]["show_state"])

    def test_normalize_placements_rejects_duplicates(self) -> None:
        with self.assertRaises(ValueError):
            util.normalize_placements(
                [
                    {"entity_id": "light.kitchen", "x": 0.1, "y": 0.2},
                    {"entity_id": "light.kitchen", "x": 0.3, "y": 0.4},
                ]
            )


class ImageDimensionParsingTest(unittest.TestCase):
    def test_png_dimensions_are_detected(self) -> None:
        png = (
            b"\x89PNG\r\n\x1a\n"
            b"\x00\x00\x00\rIHDR"
            b"\x00\x00\x00\x80"
            b"\x00\x00\x00@"
            b"\x08\x02\x00\x00\x00"
            b"\x00\x00\x00\x00"
        )
        self.assertEqual(util.image_dimensions_from_bytes(png, "image/png"), (128, 64))

    def test_unknown_image_type_returns_none_dimensions(self) -> None:
        self.assertEqual(
            util.image_dimensions_from_bytes(b"not-an-image", "image/gif"),
            (None, None),
        )


if __name__ == "__main__":
    unittest.main()

