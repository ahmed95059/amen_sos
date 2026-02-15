"""
Project: SoulSketch
File: object_detection/filter_duplicate_objects.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Provides a filtering utility to remove overlapping or duplicate object detections
based on an IoU (Intersection over Union) threshold. Keeps the higher-confidence detection.
"""

from typing import List
import itertools

# ==== Function: intersection_over_union ====
def intersection_over_union(box1, box2) -> float:
    """
    Calculates the Intersection over Union (IoU) between two bounding boxes.

    Args:
        box1 (dict): First bounding box with keys x1, y1, x2, y2.
        box2 (dict): Second bounding box with keys x1, y1, x2, y2.

    Returns:
        float: IoU score between 0 and 1.
    """
    x1 = max(box1["x1"], box2["x1"])
    y1 = max(box1["y1"], box2["y1"])
    x2 = min(box1["x2"], box2["x2"])
    y2 = min(box1["y2"], box2["y2"])

    inter_width = max(0, x2 - x1)
    inter_height = max(0, y2 - y1)
    inter_area = inter_width * inter_height

    area1 = (box1["x2"] - box1["x1"]) * (box1["y2"] - box1["y1"])
    area2 = (box2["x2"] - box2["x1"]) * (box2["y2"] - box2["y1"])
    union_area = area1 + area2 - inter_area

    if union_area == 0:
        return 0.0
    return inter_area / union_area

# ==== Function: filter_detections_by_iou ====
def filter_detections_by_iou(dets: List[dict], threshold: float = 0.5) -> List[dict]:
    """
    Removes overlapping detections by comparing IoU values between bounding boxes.
    Keeps only the detection with higher confidence when overlaps exceed the threshold.

    Args:
        dets (List[dict]): List of object detections, each with 'bbox' and 'confidence'.
        threshold (float): IoU threshold to determine whether detections overlap.

    Returns:
        List[dict]: Filtered list of non-overlapping detections.
    """
    keep_flags = [True] * len(dets)

    for i, j in itertools.combinations(range(len(dets)), 2):
        if not keep_flags[i] or not keep_flags[j]:
            continue

        box1 = dets[i]["bbox"]
        box2 = dets[j]["bbox"]
        iou = intersection_over_union(box1, box2)

        if iou > threshold:
            conf1 = dets[i]["confidence"]
            conf2 = dets[j]["confidence"]
            if conf1 >= conf2:
                keep_flags[j] = False
            else:
                keep_flags[i] = False

    return [d for k, d in zip(keep_flags, dets) if k]
