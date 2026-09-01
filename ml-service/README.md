# AarogyaMitra ML Service

Python FastAPI Service for ML model training, feature vector processing, and camera-based pose evaluation.

## Prerequisites
- Python 3.9+
- pip

## Quickstart

```bash
# Create virtualenv
python -m venv venv

# Activate virtualenv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app.main:app --port 8000 --reload
```

## API Endpoints
- `GET /`: Health status
- `POST /predict-wellness`: Accepts normalized feature vectors and predicts well-being score using trained models
