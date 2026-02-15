"""
Project: SoulSketch
File: object_detection/run_OBJ_DET.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Runs the complete object detection pipeline using YOLOv8 on a given drawing.
Performs preprocessing, detection, cropping, metadata enrichment, and visual plot generation.
Results are saved to the shared memory for downstream analysis.
"""

import shutil
from pathlib import Path
from ultralytics import YOLO

from model.model_config import (
    PROJECT_ROOT,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
    MODEL_PATH
)
from input_processor import preprocess_and_save
from boxes_cropper import crop_and_save_objects
from plot_yolo_detections import (
    draw_bounding_boxes,
    plot_class_distribution,
    plot_confidence_distribution,
)

# ==== Paths ====
INPUT_DIR = PROJECT_ROOT / "shared_memory" / "0_BE_input"
PREPROCESSED_IMG_PATH = Path("temp/processed_input.png")
SHARED_PREPROC_PATH = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "processed_input.png"
PLOTS_DIR = Path("temp/plots")
SHARED_PLOTS_DIR = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "plots"

# ==== Load YOLO Model ====
model = YOLO(MODEL_PATH)
model.fuse()

# ==== Function: run_yolo ====
def run_yolo(image_path: str) -> list[dict]:
    """
    Runs YOLO object detection and returns detection results.

    Args:
        image_path (str): Path to the image file.

    Returns:
        list[dict]: List of detection results with label, confidence, and bbox.
    """
    results = model.predict(
        source=image_path,
        conf=CONFIDENCE_THRESHOLD,
        iou=IOU_THRESHOLD,
        save=False,
        verbose=False,
    )
    dets = []
    for r in results:
        for box in r.boxes:
            dets.append({
                "label": model.names[int(box.cls.item())],
                "confidence": float(box.conf.item()),
                "bbox": dict(zip(("x1", "y1", "x2", "y2"), box.xyxy[0].tolist())),
            })
    return dets

# ==== Function: full_det_pipeline ====
def full_det_pipeline(det_image: str, crop_img, tag: str) -> None:
    """
    Executes full detection + visualization flow for a given image.

    Args:
        det_image (str): Path to image for detection.
        crop_img: Image used for cropping.
        tag (str): Tag used to label plot outputs.

    Returns:
        None
    """
    print(f"[RUN] YOLO detection on: {det_image}")
    dets = run_yolo(det_image)
    print(f"[INFO] {len(dets)} object(s) detected.")

    crop_and_save_objects(crop_img, dets, mode="colored")

    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    draw_bounding_boxes(crop_img, dets, save_path=PLOTS_DIR / f"{tag}_annotated.png")
    plot_class_distribution(dets, save_path=PLOTS_DIR / f"{tag}_class_dist.png")
    plot_confidence_distribution(dets, save_path=PLOTS_DIR / f"{tag}_conf_hist.png")

# ==== Script Entry Point ====
if __name__ == "__main__":
    print(f"[INFO] Looking for input image in: {INPUT_DIR}")
    print(f"[INFO] INPUT_DIR exists: {INPUT_DIR.exists()}")
    
    png_files = list(INPUT_DIR.glob("*.png"))
    print(f"[INFO] Found {len(png_files)} PNG files: {[f.name for f in png_files]}")
    
    if not png_files:
        print(f"[ERROR] No PNG file found in {INPUT_DIR}")
        print(f"[ERROR] Please upload an image first using the Streamlit interface")
        exit(1)
    
    original_path = png_files[0]
    print(f"[INFO] Using input image: {original_path.name}")
    
    orig_img, proc_img = preprocess_and_save(str(original_path), str(PREPROCESSED_IMG_PATH))

    SHARED_PREPROC_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PREPROCESSED_IMG_PATH, SHARED_PREPROC_PATH)
    print(f"[SAVE] Processed image copied to: {SHARED_PREPROC_PATH}")

    # Pass 1: run on processed image
    full_det_pipeline(str(PREPROCESSED_IMG_PATH), crop_img=orig_img, tag="pass1")

    # Pass 2: run again on original image
    full_det_pipeline(str(original_path), crop_img=orig_img, tag="pass2")

    # Copy plots to shared memory
    if PLOTS_DIR.exists():
        SHARED_PLOTS_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copytree(PLOTS_DIR, SHARED_PLOTS_DIR, dirs_exist_ok=True)
        print(f"[SAVE] Plots copied to: {SHARED_PLOTS_DIR}")

    # Clean temp directory
    if Path("temp").exists():
        shutil.rmtree("temp")
        print("[CLEAN] Temporary folder removed.")

    print("[DONE] Object detection pipeline complete.")
