import hashlib
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.models import Submission

def compute_sha256(file_bytes: bytes) -> str:
    """Computes exact cryptographic SHA-256 hash of the image bytes."""
    return hashlib.sha256(file_bytes).hexdigest()

def compute_simple_perceptual_hash(file_bytes: bytes) -> str:
    """
    Computes a 64-character structural byte-distribution fingerprint.
    Samples 64 uniform chunks of the image data to detect slightly modified or re-saved copies
    without requiring external C libraries.
    """
    if len(file_bytes) < 64:
        return hashlib.md5(file_bytes).hexdigest()
    
    chunk_size = len(file_bytes) // 64
    fingerprint = []
    for i in range(64):
        chunk = file_bytes[i * chunk_size : (i + 1) * chunk_size]
        avg_byte = sum(chunk) // len(chunk)
        fingerprint.append(f"{avg_byte:02x}"[0]) # single hex digit
    return "".join(fingerprint)

def check_for_duplicate(db: Session, image_bytes: bytes, user_id: int) -> Tuple[bool, Optional[str]]:
    """
    Checks if this exact image or a near-duplicate has been previously submitted.
    Returns (is_duplicate: bool, reason: str or None).
    """
    sha256_hash = compute_sha256(image_bytes)
    
    # 1. Check exact SHA-256 duplicate globally or by user
    existing_sha = db.query(Submission).filter(Submission.image_sha256 == sha256_hash).first()
    if existing_sha:
        if existing_sha.user_id == user_id:
            return True, f"Duplicate image: You already submitted this exact image on {existing_sha.created_at.strftime('%Y-%m-%d %H:%M')} (Submission #{existing_sha.id})."
        else:
            return True, f"Duplicate image: This exact image was already submitted by another user."

    # 2. Check structural byte fingerprint
    fingerprint = compute_simple_perceptual_hash(image_bytes)
    existing_fp = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.image_fingerprint == fingerprint
    ).first()
    if existing_fp:
        return True, f"Duplicate image detected: A structurally identical photo was previously submitted (Submission #{existing_fp.id})."

    return False, None
