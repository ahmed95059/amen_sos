"""
Project: SoulSketch
File: pdf_generator/build_full_report.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Main orchestration script for generating the full emotional analysis PDF report.

Steps:
1. Loads analysis data from shared_memory.
2. Generates each section of the report:
   - Cover Page
   - Table of Contents
   - General Drawing Analysis
   - Object Analysis (including plots and descriptions)
   - Facial Expression Analysis
   - Final Thank You Page
3. Merges all individual PDFs into a single full report.
4. Compresses the final PDF using Ghostscript.
5. Saves the compressed file back to shared_memory as full_analysis_report.pdf.

Dependencies:
- reportlab (for PDF generation)
- PyPDF2 (for PDF merging)
- Ghostscript executable (for compression)
"""

import sys
from pathlib import Path

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
from PyPDF2 import PdfMerger
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from compressor import compress_pdf_with_ghostscript

# Imports from page builders
from pages_builders.build_cover_page import build_cover_page
from pages_builders.build_table_of_contents import build_table_of_contents
from pages_builders.build_full_general_analysis import build_full_general_analysis
from pages_builders.build_object_pages import build_object_pages
from pages_builders.build_faces_pages import build_faces_pages
from pages_builders.build_final_thankyou_page import build_final_thankyou_page

# === Directories ===
BASE_DIR = Path(__file__).resolve().parent
ROOT = BASE_DIR.parent
SHARED = ROOT / "shared_memory"
ASSETS = ROOT / "pdf_generator" / "assets"
SOURCES = ROOT / "pdf_generator" / "sources"
PAGES_DIR = SHARED / "7_PDFG_out"
PAGES_DIR.mkdir(parents=True, exist_ok=True)
print("PAGES_DIR:", PAGES_DIR)
print("ASSETS:", ASSETS)
print("bASE_DIR:", BASE_DIR)
print("shared:", SHARED)
# === File lookup mapping ===
FILE_MAP = {
    "Original_Draw": ("BE", "drawing", "images", "BE_original_input"),
    "Processed_Draw": ("OBJDET", "drawing", "images", "OBJDET_processed_input"),
    "EC_emotion_classification_distribution": ("EC", "drawing", "plots", "EC_emotion_probs_plot"),
    "CEX_colormap_drawing_summary": ("CEX", "drawing", "plots", "CEX_plot"),
    "OBJDET_object_from_original_boxes": ("OBJDET", "objects", "plots", "OBJDET_pass1_annotated"),
    "OBJDET_object_from_processed_boxes": ("OBJDET", "objects", "plots", "OBJDET_pass2_annotated"),
    "OBJDET_object_from_original_confidence": ("OBJDET", "objects", "plots", "OBJDET_pass1_conf_hist"),
    "OBJDET_object_from_processed_confidence": ("OBJDET", "objects", "plots", "OBJDET_pass2_conf_hist"),
    "OBJDET_object_from_original_class_dist": ("OBJDET", "objects", "plots", "OBJDET_pass1_class_dist"),
    "OBJDET_object_from_processed_class_dist": ("OBJDET", "objects", "plots", "OBJDET_pass2_class_dist"),
    "FED_expression_all_boxes": ("FED", "expressions", "plots", "FED_annotated_expressions"),
    "FED_expression_confidence": ("FED", "expressions", "plots", "FED_expression_confidence"),
    "FED_expression_distribution": ("FED", "expressions", "plots", "FED_expression_distribution"),
}

def get_file_from_sources(module: str, target: str, category: str, name_starts_with: str = None) -> Path | None:
    folder = SOURCES / module / target / category
    if not folder.exists():
        return None
    for file in folder.iterdir():
        if file.is_file() and file.stem.startswith(name_starts_with):
            return file
    return None

def get_path(key):
    spec = FILE_MAP.get(key)
    return get_file_from_sources(*spec).as_posix() if spec and get_file_from_sources(*spec) else None

def generate_fallback_pdf(output_path: Path):
    c = canvas.Canvas(str(output_path), pagesize=A4)
    c.setFont("Helvetica-Bold", 24)
    c.setFillColorRGB(0, 0, 0)
    text = "PDF generation failed due to missing files"
    width, height = A4
    c.drawCentredString(width / 2, height / 2, text)
    c.showPage()
    c.save()


def run():
    post_analysis = json.loads((SHARED / "5_JSON_out/post_analysis.json").read_text())
    analysis_text = json.loads((SHARED / "6_AG_out/analysis_text.json").read_text())

    # File outputs
    cover_path = PAGES_DIR / "page_01_cover.pdf"
    toc_path = PAGES_DIR / "page_02_toc.pdf"
    general_path = PAGES_DIR / "page_03_general_analysis.pdf"
    object_path = PAGES_DIR / "page_04_objects.pdf"
    faces_path = PAGES_DIR / "page_05_faces.pdf"
    thankyou_path = PAGES_DIR / "page_06_thankyou.pdf"

    # Sanity check
    if not all([get_path("Original_Draw"), get_path("Processed_Draw")]):
        generate_fallback_pdf(PAGES_DIR / "full_analysis_report.pdf")
        return

    # 1. Cover
    build_cover_page(
        output_path=str(cover_path),
        logo_path=str(ASSETS / "logo.png"),
        banner_path=str(ASSETS / "banner.png"),
        drawing_img_path=get_path("Original_Draw")
    )

    toc_entries = [
        ("Cover Page", 1),
        ("Table of Contents", 2),
        ("General Analysis", 3),
        ("Object Analysis", 4),
        ("Facial Expressions", 5),
        ("Summary & Thank You", 6)
    ]

    # 2. Table of Contents
    build_table_of_contents(
        output_path=str(toc_path),
        entries=toc_entries,
        header_img_path=str(ASSETS / "banner.png"),
        footer_img_path=str(ASSETS / "footer.png")
    )

    # 3. General Analysis
    build_full_general_analysis(
        output_path=str(general_path),
        header_img_path=str(ASSETS / "banner.png"),
        footer_img_path=str(ASSETS / "footer.png"),
        drawing_img_path=get_path("Original_Draw"),
        processed_img_path=get_path("Processed_Draw"),
        ec_plot_img_path=get_path("EC_emotion_classification_distribution"),
        cex_plot_img_path=get_path("CEX_colormap_drawing_summary"),
        file_name="original_input.png",
        ec_result=post_analysis["pre_analysis"]["general_emotion"],
        confidence=post_analysis["pre_analysis"]["general_emotion_confidence"],
        ec_description=analysis_text["scene_descriptions"][0],
        dominant_drawing_colors=post_analysis["pre_analysis"].get("dominant_drawing_colors", [])
    )

    # 4. Objects section
    objects = []
    descriptions = analysis_text["object_descriptions"]
    images_dir = SOURCES / "OBJDET" / "objects" / "images"

    for img_path in sorted(images_dir.glob("OBJDET_*.png")):
        name = img_path.stem.replace("OBJDET_", "")
        if "_" not in name:
            continue
        obj_id, obj_type = name.split("_", 1)
        plot_path = SOURCES / "CEX" / "objects" / "plots" / f"CEX_object_{obj_id}_{obj_type}.png"
        objects.append({
            "id": obj_id,
            "type": obj_type,
            "crop_path": str(img_path),
            "plot_path": str(plot_path) if plot_path.exists() else None,
            "description": descriptions.get(f"{obj_id}_{obj_type}", [])
        })

    build_object_pages(
        output_path=str(object_path),
        header_img_path=str(ASSETS / "banner.png"),
        footer_img_path=str(ASSETS / "footer.png"),
        objects=objects,
        bbox_img_paths=[get_path("OBJDET_object_from_original_boxes"), get_path("OBJDET_object_from_processed_boxes")],
        class_conf_plot_paths=[get_path("OBJDET_object_from_original_confidence"), get_path("OBJDET_object_from_processed_confidence")],
        class_dist_plot_paths=[get_path("OBJDET_object_from_original_class_dist"), get_path("OBJDET_object_from_processed_class_dist")]
    )

    # 5. Expressions section
    expressions = []
    descriptions = analysis_text["expression_descriptions"]
    images_dir = SOURCES / "FED" / "expressions" / "images"
    plots_dir = SOURCES / "CEX" / "expressions" / "plots"

    for img_path in sorted(images_dir.glob("FED_*.png")):
        expr_id = img_path.stem.replace("FED_", "")
        plot_path = plots_dir / f"CEX_expression_{expr_id}.png"
        expressions.append({
            "id": expr_id,
            "crop_path": str(img_path),
            "plot_path": str(plot_path) if plot_path.exists() else None,
            "description": descriptions.get(expr_id, [])
        })

    build_faces_pages(
        output_path=str(faces_path),
        header_img_path=str(ASSETS / "banner.png"),
        footer_img_path=str(ASSETS / "footer.png"),
        expressions=expressions,
        detection_img_paths=[
            get_path("FED_expression_all_boxes"),
            get_path("FED_expression_confidence"),
            get_path("FED_expression_distribution")
        ]
    )

    # 6. Thank you
    build_final_thankyou_page(
        output_path=str(thankyou_path),
        header_img_path=str(ASSETS / "banner.png"),
        footer_img_path=str(ASSETS / "footer.png"),
        logo_path=str(ASSETS / "logo.png")
    )

    # 7. Merge all parts
    final_pdf = PAGES_DIR / "full_analysis_report.pdf"
    merger = PdfMerger()
    for part in [cover_path, toc_path, general_path, object_path, faces_path, thankyou_path]:
        if part.exists():
            merger.append(str(part))
    merger.write(str(final_pdf))
    merger.close()

    # 8. Clean up all other PDFs
    for pdf_file in PAGES_DIR.glob("*.pdf"):
        if pdf_file != final_pdf:
            pdf_file.unlink()

    # 9. Compress using Ghostscript (optional - skip if not available)
    try:
        compressed_pdf = PAGES_DIR / "full_analysis_report_compressed.pdf"
        compress_pdf_with_ghostscript(str(final_pdf), str(compressed_pdf))
        
        # 10. Replace original with compressed
        final_pdf.unlink(missing_ok=True)
        compressed_pdf.rename(final_pdf)
        print(f"[INFO] PDF compressed successfully: {final_pdf}")
    except FileNotFoundError as e:
        print(f"[WARNING] Ghostscript not found - skipping compression: {e}")
        print(f"[INFO] Uncompressed PDF saved: {final_pdf}")
    except Exception as e:
        print(f"[WARNING] Compression failed - keeping uncompressed PDF: {e}")
        print(f"[INFO] Uncompressed PDF saved: {final_pdf}")
    
    print(f"[SUCCESS] Final PDF saved at: {final_pdf}")


if __name__ == "__main__":
    run()

