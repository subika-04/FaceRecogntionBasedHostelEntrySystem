# Face Recognition Hostel Entry System (FRHES)

Three services, one product:

| Service | Tech | Folder |
|---|---|---|
| Frontend | React + Vite + Tailwind | `frontend/frontend` |
| Backend API | Spring Boot 3.2 | `backend/backend` |
| AI Service | Flask + InsightFace + OpenCV | `ai-service` |

## Run everything with Docker Compose (recommended)

```bash
cp .env.example .env
# edit .env: set real DB_PASSWORD, DB_ROOT_PASSWORD, JWT_SECRET, FLASK_API_KEY

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- AI service: http://localhost:5000 (internal; the frontend never calls it directly)

First boot will take a few minutes the first time: MySQL initializes, and the
AI service downloads the InsightFace `buffalo_l` model pack (~300MB, requires
internet access on this **first** run only — see `ai-service/README.md` for
offline deployment notes).

**You still need to create your first admin user manually** — see
"Creating the first user" below. There is no self-registration screen by
design (only ADMIN/STAFF accounts, provisioned by an administrator).

## Run each service individually (local development)

See each service's own README/instructions:
- `ai-service/README.md`
- Backend: `cd backend/backend && cp .env.example .env` (fill in DB + JWT + Flask settings), then `mvn spring-boot:run`
- Frontend: `cd frontend/frontend && npm install && npm run dev`

Start them in this order: MySQL → AI service → backend → frontend, since the
backend's `StartupCacheSync` tries to reach the AI service on boot (it won't
crash if the AI service isn't up yet, but recognition won't work until it is).

## Creating the first user

There is currently no in-app user-management screen (see the audit report's
Phase 2/10 findings — this is a tracked gap, not an oversight). Until
`UserController` is built:

```bash
# 1. Generate a BCrypt hash for your chosen password:
cd backend/backend
java -cp target/classes:$(mvn -q dependency:build-classpath -Dmdep.outputFile=/dev/stdout) HashGen yourpassword

# 2. Insert the user directly into MySQL (adjust role_id to match your seeded roles table):
INSERT INTO users (username, email, password, role_id, status)
VALUES ('admin', 'admin@example.com', '<bcrypt-hash-from-step-1>', 1, 'ACTIVE');
```

## Status / what's implemented vs. still open

See `AUDIT_AND_PROGRESS.md` for the full, current list of what's been fixed,
what's been newly built (the entire AI service), and what's still open for
the next work session (Spring Boot hardening pass, frontend redesign,
broader test coverage). That file is kept up to date as work continues.
