# Frontend Integration Guide (ST1 Backend)

## Base Setup
- Backend base URL: `http://127.0.0.1:8000`
- API base URL: `http://127.0.0.1:8000/api`
- OpenAPI docs: `http://127.0.0.1:8000/docs`

## Auth Model
- JWT Bearer token.
- After login, store `access_token` in localStorage/session storage.
- Send on secured calls:
  - `Authorization: Bearer <token>`

Example Axios client:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

## Core Endpoints

### Authentication
1. `POST /api/auth/signup`
- Body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name"
}
```
- Response:
```json
{
  "id": "...",
  "email": "user@example.com",
  "full_name": "User Name",
  "profile_image": null
}
```

2. `POST /api/auth/login`
- Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### User
3. `GET /api/user/me`
- Auth required
- Response:
```json
{
  "id": "...",
  "email": "user@example.com",
  "full_name": "User Name",
  "profile_image": "data:image/png;base64,..."
}
```

4. `POST /api/user/profile-image`
- Auth required
- `multipart/form-data` with `file`
- Max size: 2MB
- Response: same as `GET /api/user/me`

5. `GET /api/user/dashboard`
- Auth required
- Response:
```json
{
  "assessments": [
    {
      "id": "...",
      "source_type": "repo",
      "source_value": "https://github.com/org/repo",
      "score": 72,
      "status": "Moderate",
      "created_at": "2026-02-20T..."
    }
  ]
}
```

### Assessment / Upload
6. `POST /api/assess/run`
- Auth required
- `multipart/form-data`
- Fields:
  - `repo_url` (optional string)
  - `file` (optional ZIP file)
- At least one of repo/file must be present.
- Response: full created assessment object (includes `id`, score, signals, risks, etc.)

Example (repo):
```js
const form = new FormData();
form.append('repo_url', 'https://github.com/org/repo');
const { data } = await api.post('/assess/run', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

Example (zip):
```js
const form = new FormData();
form.append('file', zipFile);
const { data } = await api.post('/assess/run', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

7. `POST /api/upload/`
- Auth required
- Upload/ingest-only endpoint (returns sandbox info)
- Usually frontend should use `/api/assess/run` directly.

### Reports
8. `GET /api/report/`
- Auth required
- Response:
```json
{
  "reports": [ { "id": "...", "score": 81, "status": "Strong" } ]
}
```

9. `GET /api/report/{assessment_id}`
- Auth required
- Full report payload.

10. `GET /api/report/{assessment_id}/preview`
- Auth required
- UI-ready payload for the PNG-style report screen.
- Contains:
  - `application_overview`
  - `feature_ai_readiness`
  - `functionality_detail`

11. `DELETE /api/report/{assessment_id}`
- Auth required
- Response:
```json
{ "deleted": true }
```

12. `POST /api/report/bulk-delete`
- Auth required
- Body:
```json
{ "ids": ["id1", "id2"] }
```
- Response:
```json
{ "deleted_count": 2 }
```

### System
13. `GET /api/system/internet`
- Response:
```json
{ "online": true }
```

14. `GET /api/system/framework`
- Returns framework dimensions/criteria metadata.

## Recommended Frontend Flow

1. Login page
- Call `/api/auth/login`
- Save token
- Redirect dashboard

2. Upload page
- Collect repo URL or ZIP
- Call `/api/assess/run`
- On success redirect `/report/{id}`

3. Dashboard page
- Call `/api/user/dashboard`
- Show list/cards
- Open report page by `id`

4. Report page (PNG UI)
- Prefer `/api/report/{id}/preview`
- Optional secondary call to `/api/report/{id}` for raw details

## Errors (Common)
- `400`: bad payload (missing repo/file, invalid image, etc.)
- `401`: invalid/expired token
- `404`: report not found
- `500`: assessment failed (backend processing)

Frontend should show `err.response?.data?.detail || 'Something went wrong'`.

## Notes for Frontend Team
- Do not put backend secrets in frontend.
- Use only bearer token for auth.
- For large repos/zip scans, show loading state while `/assess/run` executes.
- Report preview UI should bind to `/report/{id}/preview` contract.

## Quick Test Checklist
- Signup works
- Login returns token
- `/user/me` works with token
- Upload ZIP and repo URL both work
- `/report/{id}/preview` renders correctly
- Delete report + bulk delete work
- Internet badge works via `/api/system/internet`
