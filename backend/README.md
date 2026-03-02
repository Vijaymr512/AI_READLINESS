# ST1 - AI Readiness Assessment Tool (Backend)

## Setup

1. Create and activate a Python 3.11+ virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Ensure MongoDB is running locally at `mongodb://localhost:27017`.
4. Run backend:
   - `uvicorn app.main:app --reload`

## Logs

Log files are written under `app/logs/`:
- `app.log`
- `security.log`
- `assessment.log`
- `audit.log`

## Environment (optional)

You can define these in `.env`:
- `MONGO_URI`
- `MONGO_DB`
- `JWT_SECRET_KEY`
- `JWT_EXPIRE_MINUTES`
- `CORS_ORIGINS`
