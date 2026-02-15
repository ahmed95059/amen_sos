"""
Project: mini_soulsketch
File: pdf_generator/pages_builders/build_cover_page.py
Author: ItayVazana
Date: 10/05/2025

Description:
Creates a styled cover page for the emotional analysis PDF using reportlab.
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

import random
import string
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors

# Constants
BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
SAFE_MARGIN = 10
SECTION_SPACING = 25
TIGHTER_SPACING = 15  # Reduced spacing between title and drawing preview


def generate_random_id(length=6):
    """Generate a random alphanumeric ID of given length."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def build_cover_page(output_path: str, logo_path: str, banner_path: str, drawing_img_path: str):
    """
    Generates a cover page PDF with a title, date, drawing ID, images, and logos.

    :param output_path: Where to save the generated PDF.
    :param logo_path: Path to the SoulSketch logo image.
    :param banner_path: Path to the full-width graphic banner image.
    :param drawing_img_path: Path to the drawing preview image.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Draw banner and footer
    banner_img = ImageReader(banner_path)
    c.drawImage(banner_img, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')
    c.drawImage(banner_img, 0, 0, width=width, height=FOOTER_HEIGHT, mask='auto')

    # Define usable content area
    content_top = height - BANNER_HEIGHT - SAFE_MARGIN
    content_bottom = FOOTER_HEIGHT + SAFE_MARGIN
    content_height = content_top - content_bottom - (2 * SECTION_SPACING + TIGHTER_SPACING)
    section_height = content_height / 4

    # Section 1: Logo (centered)
    logo = ImageReader(logo_path)
    logo_size = 150
    logo_y = content_top - logo_size
    c.drawImage(
        logo,
        (width - logo_size) / 2,
        logo_y,
        width=logo_size,
        height=logo_size,
        mask='auto'
    )

    # Section 2: Title + ID + Date
    sec2_top = logo_y - SECTION_SPACING
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(width / 2, sec2_top - 40, "Emotional Analysis Report")

    drawing_id = f"Drawing_{generate_random_id()}"
    current_date = datetime.now().strftime("%d/%m/%Y")

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(width / 2, sec2_top - 65, f"ID: {drawing_id}")
    c.drawCentredString(width / 2, sec2_top - 85, f"Date: {current_date}")

    # Section 3: Drawing preview (centered, 4:3 ratio)
    sec3_top = sec2_top - section_height - TIGHTER_SPACING
    drawing_img = ImageReader(drawing_img_path)
    preview_width = width * 0.6
    preview_height = preview_width * 0.75  # 4:3 ratio
    preview_y = sec3_top - preview_height
    c.drawImage(
        drawing_img,
        (width - preview_width) / 2,
        preview_y,
        width=preview_width,
        height=preview_height,
        mask='auto'
    )

    # Section 4: Footer text (moved above footer)
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(colors.grey)
    c.showPage()
    c.save()

