"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_single_object_page.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Generates a single object analysis page for the final PDF report.

Includes:
- Object crop image (top)
- Descriptive text with bold highlights (centered)
- Emotion color plot (bottom)
- Full visual layout with header/footer
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

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import re

BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
CROP_SIZE = 180
MARGIN = 50


def build_single_object_page(c: Canvas,
                              object_name: str,
                              index: int,
                              object_type: str,
                              description_lines: list,
                              crop_path: str,
                              plot_path: str,
                              header_img_path: str = "assets/banner.png",
                              footer_img_path: str = "assets/footer.png"):
    """
    Draws a single object analysis page on an existing ReportLab canvas.
    """
    width, height = A4

    # Header
    c.drawImage(header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')

    # Title
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawString(MARGIN, height - BANNER_HEIGHT - 20, f"{object_name}    type: {object_type}")

    # Crop Image (top center)
    crop_top_y = height - BANNER_HEIGHT - 60
    if crop_path:
        try:
            norm_crop = Path(crop_path).resolve().as_posix()
            c.drawImage(ImageReader(norm_crop), width / 2 - CROP_SIZE / 2, crop_top_y - CROP_SIZE,
                        width=CROP_SIZE, height=CROP_SIZE, preserveAspectRatio=True, anchor='n', mask='auto')
            c.setFont("Helvetica", 10)
            c.drawCentredString(width / 2, crop_top_y - CROP_SIZE - 10, "Object Crop")
        except Exception as e:
            print(f"[ERROR] Failed to load crop image for {object_name}: {crop_path} – {e}")
    else:
        print(f"[WARNING] No crop image path for {object_name}")

    # Text block (under crop, centered + underline for bold, fix spacing)
    text_y_start = crop_top_y - CROP_SIZE - 70
    line_height = 18
    for line in description_lines:
        segments = re.split(r'(\*\*[^*]+\*\*)', line)
        processed_segments = []
        for segment in segments:
            if not segment:
                continue
            is_bold = segment.startswith("**") and segment.endswith("**")
            clean = segment[2:-2] if is_bold else segment
            clean = clean.strip()
            if clean:
                processed_segments.append((clean, is_bold))

        total_width = sum(c.stringWidth(text + " ", "Helvetica", 11) for text, _ in processed_segments)
        x = (width - total_width) / 2
        y = text_y_start

        for text, is_bold in processed_segments:
            c.setFont("Helvetica", 11)
            c.drawString(x, y, text)
            if is_bold:
                c.setLineWidth(0.5)
                c.line(x, y - 2, x + c.stringWidth(text, "Helvetica", 11), y - 2)
            x += c.stringWidth(text + " ", "Helvetica", 11)

        text_y_start -= line_height

    # Emotion Plot (bottom)
    if plot_path:
        try:
            norm_plot = Path(plot_path).resolve().as_posix()
            plot_bottom = FOOTER_HEIGHT + 30
            plot_top = max(plot_bottom + 160, text_y_start - 20)
            plot_height = plot_top - plot_bottom
            plot_width = width - 2 * MARGIN

            c.drawImage(ImageReader(norm_plot), MARGIN, plot_bottom,
                        width=plot_width, height=plot_height,
                        preserveAspectRatio=True, mask='auto')
            c.setFont("Helvetica", 10)
            c.drawCentredString(width / 2, plot_bottom - 12, "Emotion Plot")
        except Exception as e:
            print(f"[ERROR] Failed to load plot image for {object_name}: {plot_path} – {e}")

    # Footer
    c.drawImage(footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT, mask='auto')

    c.showPage()

