# App Reader - AI Readiness Assessment Platform

Analyse any codebase against 56 security, quality, and AI-readiness rules.

See FLOW.md for full pipeline documentation and all 56 analysis rules.

## Deploy on Railway

See README steps in FLOW.md or follow these steps:
1. Push this repo to GitHub
2. Go to railway.app - New Project - Deploy from GitHub
3. Add MongoDB plugin (New Service - Database - MongoDB)
4. Set backend Root Directory to 'backend', add env vars
5. Set frontend Root Directory to 'frontend', add VITE_API_URL
6. Done!

## Local Development

Backend: cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
Frontend: cd frontend && npm install && npm run dev
