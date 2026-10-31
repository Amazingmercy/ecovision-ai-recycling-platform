from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = "user"
    phone_number: Optional[str] = None

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=100)
    phone_number: Optional[str] = None
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserAccountDetailsUpdate(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=100)
    account_number: str = Field(..., min_length=8, max_length=50)
    account_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = None

class UserResponse(UserBase):
    id: int
    wallet_points: int
    wallet_naira: int
    role: Optional[str] = "user"
    phone_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserSearchItem(BaseModel):
    id: int
    username: str
    email: str
    phone_number: Optional[str] = None
    wallet_points: int
    wallet_naira: int
    has_account_details: bool
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True

class QuickBalanceResponse(BaseModel):
    id: int
    username: str
    email: str
    wallet_points: int
    wallet_naira: int
    total_submissions: int
    verified_submissions: int
    has_account_details: bool
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Detection Item Schemas
class BoundingBox(BaseModel):
    ymin: float
    xmin: float
    ymax: float
    xmax: float

class DetectionItemResponse(BaseModel):
    id: Optional[int] = None
    class_name: str
    confidence: float
    is_verified: bool
    bbox: BoundingBox

    class Config:
        from_attributes = True

# Submission Schemas
class SubmissionResponse(BaseModel):
    id: int
    user_id: int
    customer_username: Optional[str] = None
    collection_center: Optional[str] = "Central Collection Station"
    filename: str
    image_url: str
    status: str
    plastic_count: int
    can_count: int
    other_count: int
    points_awarded: int
    naira_awarded: int
    rejection_reason: Optional[str] = None
    created_at: datetime
    detections: List[DetectionItemResponse] = []

    class Config:
        from_attributes = True

# Withdrawal Schemas
class WithdrawalCreate(BaseModel):
    points: int = Field(ge=100, description="Minimum 100 points required to withdraw")
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None

class WithdrawalResponse(BaseModel):
    id: int
    points_redeemed: int
    naira_amount: int
    bank_name: str
    account_number: str
    account_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Wallet Stats
class WalletSummary(BaseModel):
    username: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    wallet_points: int
    wallet_naira: int
    total_submissions: int
    verified_submissions: int
    plastic_total: int
    can_total: int
    other_total: int
    can_withdraw: bool
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
