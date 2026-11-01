# EcoVision AI: A Web-Based Computer Vision Reward Platform for Recyclable Waste Collection

Code and training materials for the paper "A Web-Based Computer Vision Reward Platform for Recyclable Waste Collection"

The platform checks photos of submitted waste with a YOLO11-small object detector and automatically rewards verified plastic items and cans. A hash-based check rejects duplicate submissions. It needs no smart-bin hardware.

## Running the application

### Prerequisites
- Python 3.10+
- Git

### Setup

```bash
git clone https://github.com/Amazingmercy/ecovision-ai-recycling-platform.git
cd ecovision-ai-recycling-platform

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### Start the server

```bash
python run.py
```

### Access

- Web interface: http://127.0.0.1:8000/
- API docs (Swagger): http://127.0.0.1:8000/docs

### Notes
- The trained model (`best.pt`) and a SQLite database (`recycling_platform.db`) are included, so no extra setup is needed.
- Uploaded images are saved to `uploads/`.


## Dataset

2,026 images and 10,337 bounding boxes in three classes: `plastic`, `can`, `other`.

- Sources: TrashNet (Ozkefe, 2022, Kaggle) and self-captured phone photos.
- Split by capture session, not by image: 1,625 train, 192 validation, 209 test.
- Download: [\[Google Drive link\]](https://drive.google.com/file/d/1HQMycLEducqetb1VIvv0evEcMt1Oc2U3/view?usp=sharing)
- The test set was not evaluated in the paper. Reported results are on the validation set.

## Model and results (validation set)

| Class | Precision | Recall | mAP@0.5 | mAP@0.5-0.95 |
| --- | --- | --- | --- | --- |
| Can | 0.938 | 0.750 | 0.862 | 0.395 |
| Other | 0.497 | 0.397 | 0.388 | 0.184 |
| Plastic | 0.758 | 0.662 | 0.728 | 0.318 |
| **All** | **0.731** | **0.603** | **0.659** | **0.299** |

Training settings: YOLO11-small (COCO weights), 960 px, batch 8, AdamW, 100 epochs with patience 30 (stopped at 95, best epoch 65). Full settings are in `training_run/args.yaml` and Appendix A of the paper.

## How the platform works

1. Staff upload a photo of the waste.
2. The backend rejects duplicates (SHA-256 hash across all users, and a file fingerprint per user).
3. YOLO11 detects and counts plastic items, cans and other items.
4. Items accepted at a 55% confidence threshold earn 2 points each (1 point = ₦10).
5. Users withdraw once they reach 100 points (₦1,000).

Cropped, re-photographed or re-encoded images are not detected as duplicates.

## Reproducing the training

1. Download the dataset and place it as described in the notebook.
2. Install: `pip install ultralytics==8.4.190`
3. Run `notebook/EcoVisionAi.ipynb` on a GPU (the original run used one Tesla T4, about 101 minutes).

## Running the application

See `app/README.md` for setup of the frontend, backend and database.

## Use of AI tools

AI tools were used to generate part of the application code. The research design, system design and ideas are the authors'.

## Citation

[Mercy Amaefule & Bartholomew Terna]. (2026). A web-based computer vision reward platform for recyclable waste collection. 

## Contact

Mercy Amaefule: workwithamazingmercy@gmail.com