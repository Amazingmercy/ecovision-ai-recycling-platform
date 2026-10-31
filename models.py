from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    wallet_points = Column(Integer, default=0, nullable=False)
    role = Column(String(20), default="user", nullable=False) # "user" or "center_operator"
    phone_number = Column(String(30), nullable=True)
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(50), nullable=True)
    account_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    withdrawals = relationship("Withdrawal", back_populates="user", cascade="all, delete-orphan")

    @property
    def wallet_naira(self) -> int:
        return self.wallet_points * 10

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    # Hash for exact duplicate detection (SHA-256)
    image_sha256 = Column(String(64), index=True, nullable=False)
    # Perceptual fingerprint for structural duplicate detection
    image_fingerprint = Column(String(64), index=True, nullable=True)
    
    # Verification summary
    status = Column(String(30), default="pending", nullable=False) # verified, rejected, contaminated, duplicate_blocked
    plastic_count = Column(Integer, default=0)
    can_count = Column(Integer, default=0)
    other_count = Column(Integer, default=0)
    
    points_awarded = Column(Integer, default=0)
    naira_awarded = Column(Integer, default=0)
    rejection_reason = Column(Text, nullable=True)
    collection_center = Column(String(100), default="Central Collection Station", nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="submissions")
    detections = relationship("DetectionItem", back_populates="submission", cascade="all, delete-orphan")

class DetectionItem(Base):
    __tablename__ = "detection_items"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    
    class_name = Column(String(50), nullable=False) # plastic, can, other materials
    confidence = Column(Float, nullable=False)
    is_verified = Column(Boolean, default=False)
    
    # Bounding box coordinates normalized (0.0 to 1.0)
    # Prefixed with bbox_ because 'xmin' and 'xmax' are reserved system columns in PostgreSQL
    bbox_ymin = Column(Float, nullable=False)
    bbox_xmin = Column(Float, nullable=False)
    bbox_ymax = Column(Float, nullable=False)
    bbox_xmax = Column(Float, nullable=False)

    submission = relationship("Submission", back_populates="detections")

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    points_redeemed = Column(Integer, nullable=False)
    naira_amount = Column(Integer, nullable=False)
    bank_name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=False)
    account_name = Column(String(100), nullable=False)
    status = Column(String(30), default="completed") # completed, pending
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="withdrawals")
