"""
Project: SoulSketch
File: pdf_generator/pages_builders/single_expression_page_builder.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Generates a single facial expression analysis page in the PDF.

The page includes:
- Title with expression name and type
- Top half: cropped face image
- Bottom half: emotion distribution plot
- Header and footer graphics
"""

import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors

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
MARGIN = 50


def build_single_expression_page(c: Canvas,
                                  expression_name: str,
                                  index: int,
                                  expression_type: str,
                                  description_lines: list,
                                  crop_path: str,
                                  plot_path: str,
                                  header_img_path: str = "assets/banner.png",
                                  footer_img_path: str = "assets/footer.png"):
    """
    Draws a single facial expression analysis page on an existing ReportLab canvas.

    Args:
        c (Canvas): ReportLab canvas object to draw on.
        expression_name (str): Identifier for the expression (e.g., "happy_face_1").
        index (int): Index number (for debugging or logging).
        expression_type (str): Expression label (e.g., "angry_face").
        description_lines (list): List of strings describing the expression.
        crop_path (str): Path to the cropped facial expression image.
        plot_path (str): Path to the emotion classification plot image.
        header_img_path (str): Path to the header image.
        footer_img_path (str): Path to the footer image.
    """
    width, height = A4

    # Header
    c.drawImage(header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')

    # Title line
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawString(MARGIN, height - BANNER_HEIGHT - 20, f"{expression_name}    type: {expression_type}")

    # Layout bounds
    available_height = height - BANNER_HEIGHT - FOOTER_HEIGHT - 80
    half_height = available_height / 2

    # === Crop image (top section) ===
    crop_success = False
    if crop_path:
        try:
            norm_crop = Path(crop_path).resolve().as_posix()
            c.drawImage(ImageReader(norm_crop), MARGIN, FOOTER_HEIGHT + half_height + 40,
                        width=width - 2 * MARGIN, height=half_height - 40,
                        preserveAspectRatio=True, mask='auto')
            c.setFont("Helvetica", 10)
            c.drawCentredString(width / 2, FOOTER_HEIGHT + half_height + 25, "Character Crop")
            crop_success = True
        except Exception as e:
            print(f"[ERROR] Failed to draw crop image for {expression_name}: {e}")
    if not crop_success:
        print(f"[WARNING] Missing crop image for {expression_name}")

    # === Plot image (bottom section) ===
    plot_success = False
    if plot_path:
        try:
            norm_plot = Path(plot_path).resolve().as_posix()
            plot_bottom = FOOTER_HEIGHT + 30
            plot_top = FOOTER_HEIGHT + half_height + 10
            plot_height = plot_top - plot_bottom
            plot_width = width - 2 * MARGIN

            c.drawImage(ImageReader(norm_plot), MARGIN, plot_bottom,
                        width=plot_width, height=plot_height,
                        preserveAspectRatio=True, mask='auto')
            c.setFont("Helvetica", 10)
            c.drawCentredString(width / 2, plot_bottom - 12, "Emotion Plot")
            plot_success = True
        except Exception as e:
            print(f"[ERROR] Failed to draw plot image for {expression_name}: {e}")
    if not plot_success:
        print(f"[WARNING] Missing plot image for {expression_name}")

    c.showPage()

