import os
import shutil
import uuid
import re
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from app.templates.template_manager import render_index_html, compile_index_html
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import engine, Base, get_db, init_db
import app.models as models
import app.schemas as schemas
from app.services.detector import detector_service
from app.services.reward import evaluate_submission_rewards
from app.services.anti_fraud import check_for_duplicate, compute_sha256, compute_simple_perceptual_hash
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token

# Initialize database
init_db()

# Compile modular templates and ensure static assets on startup
compile_index_html()

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Collection Center Recyclable Waste Inspection & Automated Customer Rewards Platform."
)

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve absolute directory paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
INDEX_HTML = os.path.join(TEMPLATES_DIR, "index.html")

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static and uploaded files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# --- FRONTEND ROUTE ---
@app.get("/", tags=["Interface"])
def serve_frontend():
    """Serves the main single-page web interface compiled from modular templates."""
    html_content = render_index_html()
    return HTMLResponse(content=html_content, status_code=200)


# --- AUTHENTICATION ENDPOINTS ---
@app.post("/api/auth/register", response_model=schemas.AuthResponse, tags=["Authentication"])
def register_user(data: schemas.UserRegister, db: Session = Depends(get_db)):
    """Registers a new user account with secure password hashing."""
    username = data.username.strip()
    email = data.email.strip().lower()
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        raise HTTPException(status_code=400, detail="Username may only contain letters, numbers, underscores and hyphens.")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # Check for existing username or email
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username is already taken. Please choose another username.")
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email is already registered. Please log in.")

    # Hash password and persist user
    new_user = models.User(
        username=username,
        email=email,
        password_hash=hash_password(data.password),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        role=data.role or "user",
        wallet_points=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.username)
    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=new_user
    )


@app.post("/api/auth/login", response_model=schemas.AuthResponse, tags=["Authentication"])
def login_user(data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticates a user via username or email and password."""
    identifier = data.username_or_email.strip()
    password = data.password

    user = db.query(models.User).filter(
        (models.User.username == identifier) | (models.User.email == identifier.lower())
    ).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    token = create_access_token(user.id, user.username)
    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@app.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Authentication"])
def get_current_user_profile(
    user_id: Optional[int] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieves authenticated user profile from JWT Bearer token or user_id."""
    target_id = user_id
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            target_id = int(payload["sub"])

    if not target_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    user = db.query(models.User).filter(models.User.id == target_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


# --- COLLECTION CENTER CUSTOMER MANAGEMENT & POINTS LOOKUP ---
@app.get("/api/users/search", response_model=List[schemas.UserSearchItem], tags=["Collection Center"])
def search_collection_customers(
    query: Optional[str] = "",
    limit: int = 15,
    db: Session = Depends(get_db)
):
    """
    Collection Center Customer Lookup:
    Search walk-in customers by username, email, or phone number, or list recent customers.
    """
    q = (query or "").strip().lower()
    if q:
        users = db.query(models.User).filter(
            (models.User.username.ilike(f"%{q}%")) |
            (models.User.email.ilike(f"%{q}%")) |
            (models.User.phone_number.ilike(f"%{q}%"))
        ).limit(limit).all()
    else:
        users = db.query(models.User).order_by(models.User.id.desc()).limit(limit).all()
        
    results = []
    for u in users:
        has_acc = bool(u.bank_name and u.account_number and u.account_name)
        results.append(schemas.UserSearchItem(
            id=u.id,
            username=u.username,
            email=u.email,
            phone_number=u.phone_number,
            wallet_points=u.wallet_points,
            wallet_naira=u.wallet_naira,
            has_account_details=has_acc,
            bank_name=u.bank_name,
            account_number=u.account_number,
            account_name=u.account_name
        ))
    return results


@app.post("/api/users/quick-register", response_model=schemas.UserResponse, tags=["Collection Center"])
def quick_register_customer(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Allows collection center attendant to register a new walk-in customer on the spot."""
    username = data.username.strip()
    email = data.email.strip().lower() if data.email else f"{username.lower()}@ecovision.org"
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
        
    existing = db.query(models.User).filter(
        (models.User.username.ilike(username)) | (models.User.email.ilike(email))
    ).first()
    if existing:
        return existing
        
    pwd = data.password if data.password else "Customer2026!"
    new_user = models.User(
        username=username,
        email=email,
        password_hash=hash_password(pwd),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        role="user",
        wallet_points=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/users/quick-check/{identifier}", response_model=schemas.QuickBalanceResponse, tags=["Users"])
def quick_check_points(identifier: str, db: Session = Depends(get_db)):
    """Allows users or collection center kiosks to quickly check points & account status by username or email."""
    ident = identifier.strip().lower()
    user = db.query(models.User).filter(
        (models.User.username.ilike(ident)) | (models.User.email.ilike(ident))
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail=f"No account found matching '{identifier}'.")
        
    subs = db.query(models.Submission).filter(models.Submission.user_id == user.id).all()
    verified_subs = [s for s in subs if s.points_awarded > 0]
    has_acc = bool(user.bank_name and user.account_number and user.account_name)
    
    return schemas.QuickBalanceResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        wallet_points=user.wallet_points,
        wallet_naira=user.wallet_naira,
        total_submissions=len(subs),
        verified_submissions=len(verified_subs),
        has_account_details=has_acc,
        bank_name=user.bank_name,
        account_number=user.account_number,
        account_name=user.account_name
    )


@app.put("/api/users/{user_id}/account-details", response_model=schemas.UserResponse, tags=["Users"])
@app.post("/api/users/{user_id}/account-details", response_model=schemas.UserResponse, tags=["Users"])
def update_user_account_details(
    user_id: int,
    data: schemas.UserAccountDetailsUpdate,
    db: Session = Depends(get_db)
):
    """Saves and updates bank account payout details for a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    bank_name = data.bank_name.strip()
    account_number = data.account_number.strip()
    account_name = data.account_name.strip()
    
    if len(bank_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid bank name.")
    if len(account_number) < 8 or not account_number.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid NUBAN account number (at least 8-10 digits).")
    if len(account_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid account name.")
        
    user.bank_name = bank_name
    user.account_number = account_number
    user.account_name = account_name
    if data.phone_number:
        user.phone_number = data.phone_number.strip()
        
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/users", response_model=schemas.UserResponse, tags=["Users"])
def get_or_create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Legacy compatibility endpoint: gets existing user or registers a new user."""
    existing_user = db.query(models.User).filter(
        (models.User.email == user.email.strip().lower()) | (models.User.username == user.username.strip())
    ).first()
    
    if existing_user:
        return existing_user
        
    pwd = user.password if user.password else "password123"
    new_user = models.User(
        username=user.username.strip(),
        email=user.email.strip().lower(),
        password_hash=hash_password(pwd),
        wallet_points=0,
        phone_number=user.phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/users/{user_id}/wallet", response_model=schemas.WalletSummary, tags=["Wallet"])
def get_wallet_summary(user_id: int, db: Session = Depends(get_db)):
    """Returns wallet points, Naira value, recycling statistics, and saved bank account details."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    submissions = db.query(models.Submission).filter(models.Submission.user_id == user_id).all()
    verified_subs = [s for s in submissions if s.points_awarded > 0]
    
    plastic_total = sum(s.plastic_count for s in verified_subs)
    can_total = sum(s.can_count for s in verified_subs)
    other_total = sum(s.other_count for s in verified_subs)
    
    return schemas.WalletSummary(
        username=user.username,
        email=user.email,
        phone_number=user.phone_number,
        wallet_points=user.wallet_points,
        wallet_naira=user.wallet_naira,
        total_submissions=len(submissions),
        verified_submissions=len(verified_subs),
        plastic_total=plastic_total,
        can_total=can_total,
        other_total=other_total,
        can_withdraw=(user.wallet_points >= settings.MIN_WITHDRAWAL_POINTS),
        bank_name=user.bank_name,
        account_number=user.account_number,
        account_name=user.account_name
    )


@app.get("/api/collector/stats", tags=["Collection Center"])
def get_collector_stats(db: Session = Depends(get_db)):
    """Returns center-wide aggregate totals for collector staff."""
    submissions = db.query(models.Submission).all()
    total_scans = len(submissions)
    verified_subs = [s for s in submissions if s.points_awarded > 0]
    total_plastics = sum(s.plastic_count for s in verified_subs)
    total_cans = sum(s.can_count for s in verified_subs)
    total_points = sum(s.points_awarded for s in verified_subs)
    total_naira = sum(s.naira_awarded for s in verified_subs) or (total_points * 10)
    total_customers = db.query(models.User).filter(models.User.role == "user").count()
    return {
        "total_scans": total_scans,
        "verified_scans": len(verified_subs),
        "total_plastics": total_plastics,
        "total_cans": total_cans,
        "total_points_awarded": total_points,
        "total_naira_awarded": total_naira,
        "total_customers": total_customers
    }


# --- COLLECTION CENTER WASTE SUBMISSION & CV INFERENCE ---
@app.post("/api/submissions", response_model=schemas.SubmissionResponse, tags=["Collection Center Submissions"])
async def submit_waste_image(
    user_id: int = Form(...),
    collection_center: Optional[str] = Form("Central Collection Station"),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Collection Center Waste Verification:
    1. Attendant takes a picture of the customer's recyclable waste batch at the collection center.
    2. Runs anti-fraud duplicate detection (SHA-256 and perceptual hash).
    3. Runs Computer Vision object detection (YOLO11).
    4. Evaluates items (Plastic/Can = 2 pts each if confidence >= 55%; Other = 0 pts).
    5. Credits customer wallet (1 pt = ₦10).
    6. Stores collection center record and returns bounding boxes & receipt breakdown.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer / User not found")

    if user.role in ["collector", "center_operator", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot credit recycling points to a collection staff or admin account. Please select a valid customer recycler account."
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image uploaded")

    # 1. Anti-Fraud Duplicate Check
    is_duplicate, dup_reason = check_for_duplicate(db, image_bytes, user_id)
    sub_status = "duplicate_blocked" if is_duplicate else "pending"
    reason = dup_reason if is_duplicate else None

    # 2. Save image file with secure unique name
    extension = os.path.splitext(image.filename)[1].lower() or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(image_bytes)

    # Calculate hashes for storing in DB
    sha256_hash = compute_sha256(image_bytes)
    fingerprint = compute_simple_perceptual_hash(image_bytes)

    # 3. Run Computer Vision Object Detection (YOLO11)
    raw_detections = detector_service.detect(file_path)

    # 4. Apply Business & Reward Logic (Journal Topic rules)
    p_cnt, c_cnt, o_cnt, pts, naira, eval_status, eval_reason = evaluate_submission_rewards(raw_detections)
    if is_duplicate:
        pts = 0
        naira = 0
        sub_status = "duplicate_blocked"
        reason = f"Duplicate image: {dup_reason} (No duplicate reward awarded. Bounding boxes displayed below)."
    else:
        sub_status = eval_status
        reason = eval_reason

    # 5. Persist Submission in Database with Collection Center location
    new_submission = models.Submission(
        user_id=user_id,
        filename=unique_filename,
        file_path=file_path,
        image_sha256=sha256_hash,
        image_fingerprint=fingerprint,
        status=sub_status,
        plastic_count=p_cnt,
        can_count=c_cnt,
        other_count=o_cnt,
        points_awarded=pts,
        naira_awarded=naira,
        rejection_reason=reason,
        collection_center=collection_center or "Central Collection Station"
    )
    db.add(new_submission)
    db.flush()

    # 6. Save bounding boxes for visualization
    detection_responses = []
    for d in raw_detections:
        det_item = models.DetectionItem(
            submission_id=new_submission.id,
            class_name=d["class_name"],
            confidence=d["confidence"],
            is_verified=d.get("is_verified", False),
            bbox_ymin=d["bbox"][0],
            bbox_xmin=d["bbox"][1],
            bbox_ymax=d["bbox"][2],
            bbox_xmax=d["bbox"][3]
        )
        db.add(det_item)
        detection_responses.append(
            schemas.DetectionItemResponse(
                class_name=d["class_name"],
                confidence=d["confidence"],
                is_verified=d.get("is_verified", False),
                bbox=schemas.BoundingBox(
                    ymin=d["bbox"][0],
                    xmin=d["bbox"][1],
                    ymax=d["bbox"][2],
                    xmax=d["bbox"][3]
                )
            )
        )

    # 7. Credit Points to Customer Wallet
    if pts > 0:
        user.wallet_points += pts

    db.commit()
    db.refresh(new_submission)

    return schemas.SubmissionResponse(
        id=new_submission.id,
        user_id=new_submission.user_id,
        customer_username=user.username,
        collection_center=new_submission.collection_center,
        filename=new_submission.filename,
        image_url=f"/uploads/{new_submission.filename}",
        status=new_submission.status,
        plastic_count=new_submission.plastic_count,
        can_count=new_submission.can_count,
        other_count=new_submission.other_count,
        points_awarded=new_submission.points_awarded,
        naira_awarded=new_submission.naira_awarded,
        rejection_reason=new_submission.rejection_reason,
        created_at=new_submission.created_at,
        detections=detection_responses
    )


@app.get("/api/submissions/user/{user_id}", response_model=List[schemas.SubmissionResponse], tags=["Recycling Submissions"])
def get_user_submissions(user_id: int, db: Session = Depends(get_db)):
    """Retrieves all past collection submissions credited to a specific customer."""
    submissions = db.query(models.Submission).filter(
        models.Submission.user_id == user_id
    ).order_by(models.Submission.created_at.desc()).limit(200).all()
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    username = user.username if user else f"User #{user_id}"

    results = []
    for sub in submissions:
        dets = [
            schemas.DetectionItemResponse(
                id=d.id,
                class_name=d.class_name,
                confidence=d.confidence,
                is_verified=d.is_verified,
                bbox=schemas.BoundingBox(
                    ymin=d.bbox_ymin,
                    xmin=d.bbox_xmin,
                    ymax=d.bbox_ymax,
                    xmax=d.bbox_xmax
                )
            )
            for d in ()
        ]
        results.append(
            schemas.SubmissionResponse(
                id=sub.id,
                user_id=sub.user_id,
                customer_username=username,
                collection_center=sub.collection_center or "Central Collection Station",
                filename=sub.filename,
                image_url=f"/uploads/{sub.filename}",
                status=sub.status,
                plastic_count=sub.plastic_count,
                can_count=sub.can_count,
                other_count=sub.other_count,
                points_awarded=sub.points_awarded,
                naira_awarded=sub.naira_awarded,
                rejection_reason=sub.rejection_reason,
                created_at=sub.created_at,
                detections=dets
            )
        )
    return results


@app.get("/api/submissions/center/recent", response_model=List[schemas.SubmissionResponse], tags=["Collection Center"])
def get_center_recent_submissions(limit: int = 500, db: Session = Depends(get_db)):
    """Retrieves recent recyclable waste intakes processed across all collection center counters."""
    submissions = db.query(models.Submission).options(joinedload(models.Submission.user)).order_by(models.Submission.created_at.desc()).limit(limit).all()
    results = []
    for sub in submissions:
        dets = [
            schemas.DetectionItemResponse(
                id=d.id,
                class_name=d.class_name,
                confidence=d.confidence,
                is_verified=d.is_verified,
                bbox=schemas.BoundingBox(
                    ymin=d.bbox_ymin,
                    xmin=d.bbox_xmin,
                    ymax=d.bbox_ymax,
                    xmax=d.bbox_xmax
                )
            )
            for d in ()
        ]
        results.append(
            schemas.SubmissionResponse(
                id=sub.id,
                user_id=sub.user_id,
                customer_username=sub.user.username if sub.user else f"Customer #{sub.user_id}",
                collection_center=sub.collection_center or "Central Collection Station",
                filename=sub.filename,
                image_url=f"/uploads/{sub.filename}",
                status=sub.status,
                plastic_count=sub.plastic_count,
                can_count=sub.can_count,
                other_count=sub.other_count,
                points_awarded=sub.points_awarded,
                naira_awarded=sub.naira_awarded,
                rejection_reason=sub.rejection_reason,
                created_at=sub.created_at,
                detections=dets
            )
        )
    return results


# --- REWARD WITHDRAWAL / CASHOUT ENDPOINTS ---
@app.post("/api/withdrawals", response_model=schemas.WithdrawalResponse, tags=["Withdrawals"])
def request_withdrawal(
    user_id: int,
    data: schemas.WithdrawalCreate,
    db: Session = Depends(get_db)
):
    """
    Processes cash withdrawal request.
    Rule: Minimum 100 points (= ₦1,000) required.
    Uses saved bank account details if not explicitly passed in payload.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role in ["collector", "center_operator"]:
        raise HTTPException(
            status_code=403,
            detail="Collection center operators and staff cannot make reward withdrawals. Only customer recycler accounts can redeem points."
        )

    if data.points < settings.MIN_WITHDRAWAL_POINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum withdrawal is {settings.MIN_WITHDRAWAL_POINTS} points (₦{settings.MIN_WITHDRAWAL_POINTS * settings.NAIRA_PER_POINT:,})."
        )

    if user.wallet_points < data.points:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient points. Your current balance is {user.wallet_points} points."
        )

    # Determine bank details: from form or user profile
    bank = (data.bank_name or user.bank_name or "").strip()
    acc_num = (data.account_number or user.account_number or "").strip()
    acc_name = (data.account_name or user.account_name or "").strip()

    if not bank or not acc_num or not acc_name:
        raise HTTPException(
            status_code=400,
            detail="Bank name, account number, and account name are required for payout. Please enter and save your account details first."
        )

    # Save to user profile so user doesn't have to re-enter
    user.bank_name = bank
    user.account_number = acc_num
    user.account_name = acc_name

    # Deduct points from user wallet
    user.wallet_points -= data.points
    naira_cash = data.points * settings.NAIRA_PER_POINT

    withdrawal = models.Withdrawal(
        user_id=user_id,
        points_redeemed=data.points,
        naira_amount=naira_cash,
        bank_name=bank,
        account_number=acc_num,
        account_name=acc_name,
        status="completed"
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal


@app.get("/api/withdrawals/user/{user_id}", response_model=List[schemas.WithdrawalResponse], tags=["Withdrawals"])
def get_user_withdrawals(user_id: int, db: Session = Depends(get_db)):
    """Retrieves all past bank payouts for a user."""
    return db.query(models.Withdrawal).filter(
        models.Withdrawal.user_id == user_id
    ).order_by(models.Withdrawal.created_at.desc()).all()
