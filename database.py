import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import settings

def _build_engine(url: str):
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    # Set 5-second connect_timeout so DNS / network hangs don't freeze the process
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 5})

PRIMARY_URL = settings.DATABASE_URL
FALLBACK_SQLITE_URL = "sqlite:///./recycling_platform.db"

engine = _build_engine(PRIMARY_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def _switch_to_sqlite():
    global engine, SessionLocal
    if not str(engine.url).startswith("sqlite"):
        print(f"[Database] Switching to local SQLite ({FALLBACK_SQLITE_URL}).")
        engine = _build_engine(FALLBACK_SQLITE_URL)
        SessionLocal.configure(bind=engine)
        Base.metadata.create_all(bind=engine)
        _migrate_db_schema()

def _migrate_db_schema():
    try:
        from app.services.auth import hash_password
        default_hash = hash_password("password123")
        with engine.connect() as conn:
            is_sqlite = str(engine.url).startswith("sqlite")
            if is_sqlite:
                cols = [c[1] for c in conn.execute(text("PRAGMA table_info(detection_items)")).fetchall()]
                if cols and "bbox_ymin" not in cols:
                    conn.execute(text("ALTER TABLE detection_items ADD COLUMN bbox_ymin FLOAT DEFAULT 0.0"))
                    conn.execute(text("ALTER TABLE detection_items ADD COLUMN bbox_xmin FLOAT DEFAULT 0.0"))
                    conn.execute(text("ALTER TABLE detection_items ADD COLUMN bbox_ymax FLOAT DEFAULT 0.0"))
                    conn.execute(text("ALTER TABLE detection_items ADD COLUMN bbox_xmax FLOAT DEFAULT 0.0"))
                    if "ymin" in cols:
                        conn.execute(text("UPDATE detection_items SET bbox_ymin = ymin, bbox_xmin = xmin, bbox_ymax = ymax, bbox_xmax = xmax"))
                    conn.commit()

                user_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
                if user_cols:
                    if "password_hash" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                    if "role" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
                    if "phone_number" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30)"))
                    if "bank_name" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN bank_name VARCHAR(100)"))
                    if "account_number" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN account_number VARCHAR(50)"))
                    if "account_name" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN account_name VARCHAR(100)"))
                    conn.commit()

                sub_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(submissions)")).fetchall()]
                if sub_cols and "collection_center" not in sub_cols:
                    conn.execute(text("ALTER TABLE submissions ADD COLUMN collection_center VARCHAR(100) DEFAULT 'Central Collection Station'"))
                    conn.commit()
            else:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_name VARCHAR(100)"))
                conn.execute(text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS collection_center VARCHAR(100) DEFAULT 'Central Collection Station'"))
                conn.commit()

            conn.execute(
                text("UPDATE users SET password_hash = :d_hash WHERE password_hash IS NULL OR password_hash = ''"),
                {"d_hash": default_hash}
            )
            conn.execute(
                text("UPDATE users SET role = 'collector' WHERE username = 'green_collector'")
            )
            conn.commit()
    except Exception as e:
        print(f"[Database] Schema migration note: {e}")

def init_db():
    """
    Initializes database tables.
    If the remote Supabase database cannot be resolved (e.g. temporary DNS glitch / offline),
    it safely falls back to local SQLite so the server never crashes.
    """
    global engine, SessionLocal
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
        target = "Supabase PostgreSQL" if "supabase" in str(engine.url) else "Database"
        print(f"[Database] Successfully connected to {target}.")
    except Exception as e:
        print(f"[Database] Notice: Could not reach remote database ({e}).")
        _switch_to_sqlite()

    _migrate_db_schema()

def get_db():
    """FastAPI Dependency: yields a scoped database session per request."""
    global engine, SessionLocal
    try:
        db = SessionLocal()
        # Verify connection on checkout
        db.execute(text("SELECT 1"))
    except Exception as e:
        print(f"[Database] Notice: Session connect issue ({e}). Re-routing to local SQLite.")
        _switch_to_sqlite()
        db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
