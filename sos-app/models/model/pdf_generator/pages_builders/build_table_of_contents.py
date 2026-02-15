"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_table_of_contents.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Creates a styled Table of Contents page for the emotional analysis PDF.

Includes:
- Visual header and footer
- Centered title
- Dynamic TOC entries list with aligned page numbers
"""

import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# === Layout Constants ===
BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
SAFE_MARGIN = 10
SECTION_SPACING = 25


def build_table_of_contents(output_path: str,
                            entries: list[tuple[str, int]],
                            header_img_path: str,
                            footer_img_path: str):
    """
    Generates a Table of Contents page for the PDF with visual header and footer.

    Args:
        output_path (str): Path to save the generated TOC page.
        entries (list[tuple[str, int]]): List of TOC entries as (section title, page number).
        header_img_path (str): Path to header image.
        footer_img_path (str): Path to footer image.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # === Draw Header & Footer ===
    c.drawImage(ImageReader(header_img_path), 0, height - BANNER_HEIGHT,
                width=width, height=BANNER_HEIGHT, mask='auto')
    c.drawImage(ImageReader(footer_img_path), 0, 0,
                width=width, height=FOOTER_HEIGHT, mask='auto')

    # === Define Usable Content Area ===
    content_top = height - BANNER_HEIGHT - SAFE_MARGIN
    content_bottom = FOOTER_HEIGHT + SAFE_MARGIN
    full_height = content_top - content_bottom
    quarter_height = full_height / 4

    usable_top = content_top - quarter_height
    usable_bottom = content_bottom + quarter_height

    # === Title ===
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(width / 2, usable_top + quarter_height / 2, "Table of Contents")

    # === TOC Entries ===
    c.setFont("Helvetica", 13)
    c.setFillColor(colors.black)
    line_height = 24
    start_y = usable_top - 20

    for idx, (title, page_num) in enumerate(entries):
        text = f"{title} ............................................. {page_num}"
        c.drawString(100, start_y - idx * line_height, text)

    c.showPage()
    c.save()

