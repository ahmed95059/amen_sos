"""
Project: SoulSketch
File: pdf_generator/compressor.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Compresses a PDF file using Ghostscript with customizable quality settings.
Supports options like image resolution, quality level, and whether to downsample images.
Designed to run silently without opening a console window during compression.
"""

import sys
from pathlib import Path

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import subprocess
import os


def compress_pdf_with_ghostscript(input_path: str, output_path: str):
    """
    Compresses a PDF file using Ghostscript.

    Args:
        input_path (str): The file path to the original PDF that needs to be compressed.
        output_path (str): The file path where the compressed PDF will be saved.

    Optional internal parameters:
        quality (str): Compression level for images inside the PDF. Options:
            "screen"   - Low quality, smallest file size.
            "ebook"    - Medium quality (default).
            "printer"  - High quality for printing.
            "prepress" - Very high quality.
        resolution (int): Image resolution in DPI. Common values: 72, 150, 300 (default).
        downsample_images (bool): Whether to downsample images to reduce file size.
    """
    gs_path = "external_tools/gs9-55/bin/gswin64c.exe"

    if not os.path.exists(gs_path):
        raise FileNotFoundError(f"Ghostscript executable not found at {gs_path}")

    # Default compression parameters
    quality = "ebook"
    resolution = 300
    downsample_images = False

    command = [
        gs_path,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS=/{quality}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-dColorImageResolution={resolution}",
        f"-dDownsampleGrayImages={str(downsample_images).lower()}",
        "-dDownsampleColorImages=false" if not downsample_images else "-dDownsampleColorImages=true",
        f"-sOutputFile={output_path}",
        input_path
    ]

    try:
        print(f"Running Ghostscript compression: {gs_path}...")
        subprocess.Popen(command, creationflags=subprocess.CREATE_NO_WINDOW).wait()
        print(f"PDF compression successful! Output saved at: {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Ghostscript error: {e}")
        raise
    except FileNotFoundError as e:
        print(f"Error: {e}")
        raise
