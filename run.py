"""
EcoVision AI Platform Launcher
Run this script to start the local development server:
    cd app
    python run.py
or from the project root:
    python app/run.py
"""

import sys
import os
import uvicorn

# Ensure both parent directory and app directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print(" EcoVision AI - Recyclable Waste Reward Platform")
    print("=" * 60)
    print(" Starting FastAPI server at: http://127.0.0.1:8000")
    print(" Interactive API Docs (Swagger): http://127.0.0.1:8000/docs")
    print(" Web Interface: http://127.0.0.1:8000/")
    print("=" * 60 + "\n")
    
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
