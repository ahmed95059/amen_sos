"""
Project: SoulSketch
File: pdf_generator/build_sources_folder.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Prepares the 'sources' folder used for PDF generation.

This includes:
- Scanning the shared_memory directory
- Copying and renaming relevant .png and .json files
- Organizing files into module-tagged subfolders by category
- Handling fallback images when necessary
- Adding derived plots (like CEX object/expression plots)
- Cleaning up empty folders
"""

from PIL import Image
import shutil
import os
from pathlib import Path

# === Config ===
DEBUG = False

# === Base paths ===
BASE_DIR = Path(__file__).resolve().parent.parent
SHARED_DIR = BASE_DIR / "shared_memory"
SOURCES_DIR = BASE_DIR / "pdf_generator" / "sources"
SOURCES_DIR.mkdir(parents=True, exist_ok=True)

EXCLUDED_DIRS = {"0_BE_out", "7_PDFG_out", "8_History"}


def standardize_image_size(input_path: str, output_path: str, placeholder_size=(600, 600)):
    try:
        img = Image.open(input_path).convert("RGB")
        img.save(output_path)
    except Exception:
        placeholder = Image.new("RGB", placeholder_size, color=(255, 255, 255))
        placeholder.save(output_path)


def get_module_tag(folder_name: str) -> str:
    if folder_name == "0_BE_input":
        return "BE"
    if "_" in folder_name:
        return folder_name.split("_", 1)[1].replace("_out", "").replace("_", "").upper()
    return folder_name.upper()


def resolve_target_path(file_path: Path) -> tuple[str, Path]:
    parts = file_path.parts
    module_folder = next((p for p in parts if p.endswith("_out") or p == "0_BE_input"), None)
    if not module_folder:
        return None, None

    module = get_module_tag(module_folder)
    rel_path = Path(*parts[parts.index(module_folder)+1:])

    if module == "BE" and rel_path.match("original_input.png"):
        return module, Path("drawing/images")
    if module == "EC":
        if rel_path.match("EC_result.json"):
            return module, Path("drawing/json")
        if rel_path.match("plots/emotion_probs_plot.png"):
            return module, Path("drawing/plots")
    if module == "OBJDET":
        if rel_path.match("processed_input.png"):
            return module, Path("drawing/images")
        if rel_path.match("objects/colored/crops/*.png"):
            return module, Path("objects/images")
        if rel_path.match("objects/colored/jsons/*.json"):
            return module, Path("objects/json")
        if "plots" in str(rel_path):
            return module, Path("objects/plots")
    if module == "FED":
        if rel_path.match("facial_expressions/expressions.json"):
            return module, Path("expressions/json")
        if rel_path.match("facial_expressions/crops/*.png"):
            return module, Path("expressions/images")
        if "plots" in str(rel_path):
            return module, Path("expressions/plots")
    if module == "CEX":
        if rel_path.match("colors/JSON/drawing_results.json"):
            return module, Path("drawing/json")
        if rel_path.match("colors/JSON/object_results.json"):
            return module, Path("objects/json")
        if rel_path.match("colors/JSON/facial_expression_results.json"):
            return module, Path("expressions/json")
        if rel_path.match("colors/plots/drawing/summary/plot.png"):
            return module, Path("drawing/plots")
        if "colors/plots/object" in str(rel_path):
            return module, Path("objects/plots")
        if "colors/plots/expression" in str(rel_path):
            return module, Path("expressions/plots")
    if module == "JSON":
        if rel_path.match("pre_analysis.json") or rel_path.match("post_analysis.json"):
            return module, Path("drawing/json")
    if module == "AG" and rel_path.match("analysis_text.json"):
        return module, Path("drawing/json")
    return None, None


# === Step 0: Create all subdirs ===
ALL_CATEGORIES = [
    "drawing/images", "drawing/json", "drawing/plots",
    "objects/images", "objects/json", "objects/plots",
    "expressions/images", "expressions/json", "expressions/plots"
]

found_modules = set()
for root, _, files in os.walk(SHARED_DIR):
    rel_path = Path(root).relative_to(SHARED_DIR)
    if any(part in EXCLUDED_DIRS for part in rel_path.parts):
        continue
    for file in files:
        source_file = Path(root) / file
        module, _ = resolve_target_path(source_file)
        if module:
            found_modules.add(module)

for module in found_modules:
    for cat in ALL_CATEGORIES:
        (SOURCES_DIR / module / cat).mkdir(parents=True, exist_ok=True)


# === Step 1: Copy files ===
for root, _, files in os.walk(SHARED_DIR):
    rel_path = Path(root).relative_to(SHARED_DIR)
    if any(part in rel_path.parts for part in EXCLUDED_DIRS):
        continue

    for file in files:
        if not (file.endswith(".png") or file.endswith(".json")):
            continue

        source_file = Path(root) / file
        module, target_subpath = resolve_target_path(source_file)
        if module is None or target_subpath is None:
            if DEBUG:
                print(f"[SKIPPED] Unrecognized path: {source_file}")
            continue

        target_dir = SOURCES_DIR / module / target_subpath
        new_name = f"{module}_{file}"
        target_file = target_dir / new_name

        if file.endswith(".json"):
            shutil.copy2(source_file, target_file)
        else:
            standardize_image_size(str(source_file), str(target_file))

        if DEBUG:
            print(f"[COPY] {source_file} → {target_file}")


# === Step 2: Add renamed CEX object plots ===
obj_crop_dir = SOURCES_DIR / "OBJDET" / "objects" / "images"
if obj_crop_dir.exists():
    for crop_path in obj_crop_dir.glob("OBJDET_*.png"):
        obj_id = crop_path.stem.replace("OBJDET_", "")
        source_plot = SHARED_DIR / "4_CEX_out/colors/plots/object" / obj_id / "plot.png"
        if source_plot.exists():
            target_dir = SOURCES_DIR / "CEX" / "objects" / "plots"
            target_dir.mkdir(parents=True, exist_ok=True)
            target_file = target_dir / f"CEX_object_{obj_id}.png"
            standardize_image_size(str(source_plot), str(target_file))
            if DEBUG:
                print(f"[CEX OBJ PLOT] {source_plot} → {target_file}")


# === Step 3: Add renamed CEX expression plots ===
exp_crop_dir = SOURCES_DIR / "FED" / "expressions" / "images"
if exp_crop_dir.exists():
    for crop_path in exp_crop_dir.glob("FED_*.png"):
        expr_id = crop_path.stem.replace("FED_", "")
        source_plot = SHARED_DIR / "4_CEX_out/colors/plots/expression" / expr_id / "plot.png"
        if source_plot.exists():
            target_dir = SOURCES_DIR / "CEX" / "expressions" / "plots"
            target_dir.mkdir(parents=True, exist_ok=True)
            target_file = target_dir / f"CEX_expression_{expr_id}.png"
            standardize_image_size(str(source_plot), str(target_file))
            if DEBUG:
                print(f"[CEX EXP PLOT] {source_plot} → {target_file}")


# === Step 4: Clean empty folders ===
def remove_empty_dirs(path: Path):
    for sub in path.iterdir():
        if sub.is_dir():
            remove_empty_dirs(sub)
            if not any(sub.iterdir()):
                sub.rmdir()
                if DEBUG:
                    print(f"Removed empty folder: {sub}")


if __name__ == "__main__":
    remove_empty_dirs(SOURCES_DIR)

    if DEBUG:
        print("\n=== Completed building sources folder ===")
        print("Resulting directory tree under pdf_generator/sources/:")
        def print_tree(path: Path, prefix: str = ""):
            entries = sorted(list(path.iterdir()), key=lambda p: (not p.is_dir(), p.name.lower()))
            for i, entry in enumerate(entries):
                connector = "└── " if i == len(entries) - 1 else "├── "
                print(f"{prefix}{connector}{entry.name}")
                if entry.is_dir():
                    extension = "    " if i == len(entries) - 1 else "│   "
                    print_tree(entry, prefix + extension)
        print_tree(SOURCES_DIR)
