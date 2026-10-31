from typing import List, Dict, Any, Tuple
from app.config import settings

def evaluate_submission_rewards(detections: List[Dict[str, Any]]) -> Tuple[int, int, int, int, int, str, str]:
    """
    Evaluates detections against the research rules :
    - Confidence threshold >= 0.55 for verified status.
    - Points = (n_p * 2) + (n_c * 2)
    - other materials = 0 points
    - 1 point = ₦10
    
    Returns:
    (plastic_count, can_count, other_count, points_awarded, naira_awarded, status, reason)
    """
    plastic_count = 0
    can_count = 0
    other_count = 0
    
    for item in detections:
        cls_name = item["class_name"].lower()
        conf = item["confidence"]
        
        # Check confidence threshold (0.55)
        if conf >= settings.CONFIDENCE_THRESHOLD:
            if cls_name == "plastic":
                plastic_count += 1
                item["is_verified"] = True
            elif cls_name == "can":
                can_count += 1
                item["is_verified"] = True
            else:
                other_count += 1
                item["is_verified"] = False
        else:
            other_count += 1
            item["is_verified"] = False

    # Calculate points and naira
    points_awarded = (plastic_count * settings.POINTS_PER_PLASTIC) + (can_count * settings.POINTS_PER_CAN)
    naira_awarded = points_awarded * settings.NAIRA_PER_POINT
    
    # Determine status & reason
    if points_awarded > 0:
        if other_count > 0:
            status = "verified_with_warning"
            reason = f"Verified {plastic_count} plastic, {can_count} can(s). Warning: {other_count} non-recyclable or unverified item(s) detected in the frame."
        else:
            status = "verified"
            reason = f"Verified all items! Found {plastic_count} plastic item(s) and {can_count} can(s)."
    else:
        status = "rejected"
        if other_count > 0:
            reason = "No qualifying recyclables verified. Detected items were non-recyclable or below 55% confidence threshold."
        else:
            reason = "No recyclable items detected in the image."

    return plastic_count, can_count, other_count, points_awarded, naira_awarded, status, reason
