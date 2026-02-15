"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_full_general_analysis.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Generates the full "General Analysis" section of the emotional PDF report.

Includes:
1. Page 1 – Drawing image + Emotion classification (EC) plot + EC text result + color summary
2. Page 2 – Color Emotion Extraction (CEX) plot + Processed input image

This is a core visual and interpretive part of the report.
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

import re
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors

BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
SAFE_MARGIN = 10
SECTION_SPACING = 15
PLOT_WIDTH = 180
PLOT_HEIGHT = 180
MARGIN = 50


def generate_color_summary(dominant_colors):
    """
    Generate a smart textual summary based on dominant drawing colors.
    :param dominant_colors: List of dicts, each with 'color_name', 'emotion', and 'proportion'
    :return: Text summary string
    """
    if not dominant_colors:
        return ""

    sorted_colors = sorted(dominant_colors, key=lambda x: -x.get("proportion", 0))
    top_colors = sorted_colors[:3]
    summary_parts = []

    for entry in top_colors:
        color = entry.get("color_name", "a color")
        emotion = entry.get("emotion", "an emotion")
        summary_parts.append(f"{color} ({emotion})")

    if len(summary_parts) == 1:
        return f"The drawing is visually dominated by {summary_parts[0]}."
    elif len(summary_parts) == 2:
        return f"The drawing features mostly {summary_parts[0]} and {summary_parts[1]}."
    else:
        return f"Visually, the drawing combines {summary_parts[0]}, {summary_parts[1]}, and {summary_parts[2]}."


def build_general_analysis_page_1(c, width, height,
                                   header_img_path, footer_img_path,
                                   drawing_img_path, ec_plot_img_path,
                                   ec_result, confidence, ec_description,
                                   dominant_colors_summary=""):
    """
    Builds the first general analysis page with title, visuals, emotion result, and summary.
    """
    c.drawImage(ImageReader(header_img_path), 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')
    c.drawImage(ImageReader(footer_img_path), 0, 0, width=width, height=FOOTER_HEIGHT, mask='auto')

    content_top = height - BANNER_HEIGHT
    content_bottom = FOOTER_HEIGHT + SAFE_MARGIN
    total_height = content_top - content_bottom - 3 * SECTION_SPACING
    section_height = total_height / 4
    center_x = width / 2
    TITLE_MARGIN = 25

    title_y = height - BANNER_HEIGHT - TITLE_MARGIN
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(center_x, title_y, "General Analysis – Draw")

    half_width = (width - 2 * SAFE_MARGIN - 5) / 2
    visual_top = title_y - SECTION_SPACING
    visual_height = section_height * 2 + 10
    img_y = visual_top - visual_height

    c.drawImage(ImageReader(drawing_img_path), SAFE_MARGIN, img_y,
                width=half_width, height=visual_height, preserveAspectRatio=True, mask='auto')
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawCentredString(SAFE_MARGIN + half_width / 2, img_y - 12, "The original drawing")

    c.drawImage(ImageReader(ec_plot_img_path), SAFE_MARGIN + half_width + 5, img_y,
                width=half_width, height=visual_height, preserveAspectRatio=True, mask='auto')
    c.drawCentredString(SAFE_MARGIN + 1.5 * half_width + 5, img_y - 12, "Emotion Distribution Plot")

    base_y = content_bottom + section_height + SECTION_SPACING

    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawString(SAFE_MARGIN, base_y + 65, "The dominant emotion in this drawing is:")

    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(center_x, base_y + 25, ec_result)

    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#888888"))
    confidence_pct = int(confidence * 100)
    c.drawCentredString(center_x, base_y - 10, f"Confidence – {confidence_pct}%")

    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 11)
    ec_description = re.sub(r"\(\d\.\d+\)", "", ec_description)
    words = ec_description.replace("**", " ** ").split()
    to_bold = False
    line = ''
    for word in words:
        if word == "**":
            to_bold = not to_bold
            continue
        if to_bold:
            line += f"<B>{word}</B> "
        else:
            line += word + " "
    line = line.strip()

    text_obj = c.beginText()
    text_width = c.stringWidth(line.replace("<B>", "").replace("</B>", ""), "Helvetica", 11)
    text_obj.setTextOrigin((width - text_width) / 2, base_y - 40)

    to_bold = False
    for word in line.split():
        if word.startswith("<B>") and word.endswith("</B>"):
            clean = word[3:-4]
            text_obj.setFont("Helvetica-Bold", 11)
            text_obj.textOut(clean + ' ')
        else:
            text_obj.setFont("Helvetica", 11)
            text_obj.textOut(word + ' ')
    c.drawText(text_obj)

    dominant_colors_summary = re.sub(r"\(\d\.\d+\)", "", dominant_colors_summary)
    dominant_colors_summary = re.sub(r"\s{2,}", " ", dominant_colors_summary).strip()

    if dominant_colors_summary:
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor("#333333"))
        summary_width = c.stringWidth(dominant_colors_summary, "Helvetica-Bold", 11)
        c.drawString((width - summary_width) / 2, base_y - 60, dominant_colors_summary)
    else:
        c.setFont("Helvetica", 11)
        c.drawCentredString(center_x, base_y - 60, "(Color-based summary to be generated here.)")

    c.showPage()


def build_general_analysis_page_2(c, width, height,
                                   header_img_path, footer_img_path,
                                   cex_plot_img_path, processed_img_path):
    """
    Builds the second general analysis page with two horizontal sections:
    - Top half: color emotion plot
    - Bottom half: processed image
    """
    c.drawImage(ImageReader(header_img_path), 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')
    c.drawImage(ImageReader(footer_img_path), 0, 0, width=width, height=FOOTER_HEIGHT, mask='auto')

    content_top = height - BANNER_HEIGHT
    content_bottom = FOOTER_HEIGHT
    content_height = content_top - content_bottom
    half_height = content_height / 2

    c.drawImage(
        ImageReader(cex_plot_img_path),
        0,
        content_bottom + half_height,
        width=width,
        height=half_height,
        preserveAspectRatio=True,
        anchor='s',
        mask='auto'
    )

    c.drawImage(
        ImageReader(processed_img_path),
        0,
        content_bottom,
        width=width,
        height=half_height,
        preserveAspectRatio=True,
        anchor='s',
        mask='auto'
    )

    c.showPage()


def build_full_general_analysis(output_path: str,
                                 header_img_path: str,
                                 footer_img_path: str,
                                 drawing_img_path: str,
                                 processed_img_path: str,
                                 ec_plot_img_path: str,
                                 cex_plot_img_path: str,
                                 file_name: str,
                                 ec_result: str,
                                 confidence: float,
                                 ec_description: str,
                                 dominant_drawing_colors: list = None):
    """
    Builds both general analysis pages into a single PDF.
    Page 1: Drawing + EC plot + emotion result
    Page 2: CEX plot + processed image (no text)
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    color_summary = generate_color_summary(dominant_drawing_colors or [])

    build_general_analysis_page_1(c, width, height,
                                  header_img_path, footer_img_path,
                                  drawing_img_path, ec_plot_img_path,
                                  ec_result, confidence, ec_description,
                                  color_summary)

    build_general_analysis_page_2(c, width, height,
                                  header_img_path, footer_img_path,
                                  cex_plot_img_path, processed_img_path)

    c.save()

