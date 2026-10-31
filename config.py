import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in app/ directory or parent root directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings:
    PROJECT_NAME: str = "EcoVision - AI Recyclable Waste Reward Platform"
    VERSION: str = "1.0.0"
    
    # Database URL: Reads from .env if present, otherwise defaults to local SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recycling_platform.db")
    
    # Upload storage directory
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")
    
    # Business Rules (Exact figures from updated JOURNAL TOPIC docx)
    CONFIDENCE_THRESHOLD: float = 0.55  # 55% minimum confidence required for verification
    POINTS_PER_PLASTIC: int = 2         # 2 points per accepted plastic bottle/item
    POINTS_PER_CAN: int = 2             # 2 points per accepted aluminum can
    POINTS_PER_OTHER: int = 0           # 0 points for other materials (non-rewarded)
    NAIRA_PER_POINT: int = 10           # Each point = ₦10
    MIN_WITHDRAWAL_POINTS: int = 100    # Min 100 points (₦1,000) required to withdraw cash
    
    # Target Classes according to journal topic
    TARGET_CLASSES = ["plastic", "can", "other materials"]
    
    # Class colors for bounding box visualization (Figure 3 in Journal Topic):
    # Plastic: turquoise (#00FFCE), Cans: dark blue (#483D8B), Other: pink (#DB7093)
    CLASS_COLORS = {
        "plastic": "#00FFCE",
        "can": "#483D8B",
        "other materials": "#DB7093"
    }

settings = Settings()
