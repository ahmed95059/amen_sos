"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_final_thankyou_page.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Generates the final "Thank You" page in the PDF report.
Includes a farewell message, logo, project description, and credits.
All content is styled and centered using ReportLab.
"""

import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80

THANK_YOU_TEXT = """
Thank you for exploring the world of emotions with Etma'en – the Emotional Drawing Analyzer.
We’re proud to help unveil the feelings behind every brushstroke, every line, every color.
Your curiosity fuels the bridge between creativity and insight – and we’re honored to walk that path with you.
"""

PROJECT_DESCRIPTION = """
SoulSketch began as a bold academic challenge — a final project for the
"Algorithms in Machine Learning and Multimedia in Python" course — and evolved into a meaningful journey.
Powered by deep learning, it transforms children's drawings into emotional narratives,
combining object recognition, facial expression decoding, and rich color-emotion analysis.
More than code, this project is our heartfelt attempt to connect psychology and AI, art and algorithm.
"""

CREDITS_LINE = "Created with ♥ by Itay Vazana & Oriya Even Chen"


def build_final_thankyou_page(output_path: str,
                               header_img_path: str,
                               footer_img_path: str,
                               logo_path: str):
    """
    Generates a final thank-you and project info page with centered layout.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Header and footer
    c.drawImage(header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT, mask='auto')
    c.drawImage(footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT, mask='auto')

    # Divide content area
    content_top = height - BANNER_HEIGHT
    content_bottom = FOOTER_HEIGHT
    section_height = (content_top - content_bottom) / 3

    center_x = width / 2

    # Section 1: Thank you text (centered)
    c.setFont("Helvetica", 11)
    y = content_bottom + 2 * section_height + section_height / 2 + 30
    for line in THANK_YOU_TEXT.strip().split("\n"):
        parts = line.split("SoulSketch")
        text_obj = c.beginText()
        text_obj.setTextOrigin(center_x, y)
        text_obj.setFont("Helvetica", 11)
        if len(parts) == 1:
            text_obj.setTextOrigin(center_x - c.stringWidth(line) / 2, y)
            text_obj.textLine(line)
        else:
            offset_x = center_x - c.stringWidth(line) / 2
            text_obj.setTextOrigin(offset_x, y)
            for i, part in enumerate(parts):
                text_obj.setFont("Helvetica", 11)
                text_obj.textOut(part)
                if i != len(parts) - 1:
                    text_obj.setFont("Helvetica-Bold", 11)
                    text_obj.textOut("SoulSketch")
        c.drawText(text_obj)
        y -= 14

    # Section 2: Logo
    c.drawImage(logo_path, center_x - 150, content_bottom + section_height + (section_height - 300) / 2 + 20,
                width=300, height=300, mask='auto')

    # Section 3: Description + credits
    y = content_bottom + section_height - 40
    for line in PROJECT_DESCRIPTION.strip().split("\n"):
        parts = line.split("SoulSketch")
        full_line = line.strip()
        total_width = c.stringWidth(full_line, "Helvetica", 10)
        offset_x = center_x - total_width / 2

        text_obj = c.beginText()
        text_obj.setFont("Helvetica", 10)
        text_obj.setTextOrigin(offset_x, y)

        for i, part in enumerate(parts):
            text_obj.setFont("Helvetica", 10)
            text_obj.textOut(part)
            if i != len(parts) - 1:
                text_obj.setFont("Helvetica-Bold", 10)
                text_obj.textOut("SoulSketch")

        c.drawText(text_obj)
        y -= 12

    # Credits
    y -= 25
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawCentredString(center_x, y, CREDITS_LINE)

    c.showPage()
    c.save()

