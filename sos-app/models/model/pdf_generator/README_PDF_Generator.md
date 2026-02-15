# PDF Generator Module – SoulSketch

**Authors:** Itay Vazana & Oriya Even Chen  
**Project:** SoulSketch – Final PDF Report Generation

## 🎯 Purpose

The `pdf_generator` module is responsible for building the final emotional analysis report in PDF format.  
It compiles the analysis outputs of all previous stages into a multi-page, structured, and styled document using ReportLab.

## 📁 Structure Overview

```
pdf_generator/
├── assets/                     # Static assets (logo, header/footer images)
├── pages_builders/            # Code for building individual page types
├── sources/                   # Temp staging folder auto-built from shared_memory
├── build_sources_folder.py    # Populates 'sources/' with renamed files
├── build_full_report.py       # Full pipeline for generating and merging the PDF
├── compressor.py              # GhostScript-based PDF compressor
├── run_PDFG.py                # Main orchestrator script
```

## 🧩 Key Components

### 🔨 `build_sources_folder.py`
- Collects relevant outputs from `shared_memory/` and organizes them by module and category (e.g., object crops, plots).
- Renames files to a standard format (e.g., `OBJDET_person_0001.png`) for consistent access.

### 📚 `pages_builders/`
Each file here generates a specific section or page layout in the final PDF:
- `build_cover_page.py`: Stylized title page with drawing ID and date
- `build_table_of_contents.py`: Dynamically generated TOC
- `build_full_general_analysis.py`: Two-page analysis of overall drawing (emotion + color plots)
- `build_object_pages.py`: Analysis of detected objects (context + per-object pages)
- `build_faces_pages.py`: Facial expression section (intro + per-expression pages)
- `build_final_thankyou_page.py`: Closing page with project description and credits
- `single_object_page_builder.py`: Logic for a single object’s detailed page
- `single_expression_page_builder.py`: Logic for a single facial expression’s page

### 🧪 `build_full_report.py`
- Central script that ties together all page builders.
- Loads `post_analysis.json` and `analysis_text.json` for content.
- Orchestrates:
  1. Cover
  2. Table of Contents
  3. General analysis
  4. Object analysis
  5. Facial expressions
  6. Final Thank You
- Merges all pages into one final PDF.
- Automatically compresses the result using Ghostscript.

### 🗜️ `compressor.py`
- Uses Ghostscript to reduce PDF file size without visible quality loss.
- Optional control for resolution and image downsampling.

### 🚀 `run_PDFG.py`
- Runs the entire PDF generation flow in order:
  1. Calls `build_sources_folder.py`
  2. Executes `build_full_report.py`
  3. Cleans up the intermediate `sources/` folder

## 📤 Output

The final compressed PDF report is saved at:

```
shared_memory/7_PDFG_out/full_analysis_report.pdf
```

This file is suitable for user download and backend transmission.

## 📝 Dependencies
- `reportlab`: for PDF generation
- `PyPDF2`: for merging PDFs
- `Pillow`: for placeholder image handling
- `Ghostscript`: for optional compression (included manually in `external_tools`)