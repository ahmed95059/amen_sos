"""
Project: SoulSketch
File: facial_expressions_detection/utils/detection_utils.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Utility functions for loading the facial expression YOLOv8 model
and filtering its output to include only relevant facial expression labels.
"""

import sys
from pathlib import Path
from ultralytics import YOLO

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Function: load_model ====
def load_model(model_path, conf_thresh, iou_thresh):
    """
    Loads a YOLOv8 model with specific confidence and IoU thresholds.

    Args:
        model_path (str): Path to the YOLO model file.
        conf_thresh (float): Confidence threshold for filtering predictions.
        iou_thresh (float): IoU threshold for non-maximum suppression.

    Returns:
        YOLO: Loaded YOLO model instance with configured parameters.
    """
    model = YOLO(model_path)
    model.conf = conf_thresh
    model.iou = iou_thresh
    return model

# ==== Function: filter_facial_expressions ====
def filter_facial_expressions(results, label_list):
    """
    Filters YOLO detection results to include only facial expression labels.

    Args:
        results (ultralytics.results.Results): Raw YOLO detection output.
        label_list (List[str]): List of valid expression labels to keep.

    Returns:
        List[dict]: Filtered detection list with label, bbox, and confidence.
    """
    detections = []
    for box in results.boxes.data:
        cls_id = int(box[5].item())
        label = results.names[cls_id]
        if label in label_list:
            x1, y1, x2, y2 = map(float, box[:4])
            confidence = float(box[4].item())
            detections.append({
                "label": label,
                "bbox": [x1, y1, x2, y2],
                "confidence": confidence
            })
    return detections
