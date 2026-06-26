# Todo Takehome

Small full-stack task management application built for a take-home assignment.

The app lets a user register, log in, and manage their own tasks. It uses a .NET API, EF Core with SQLite, and a React TypeScript frontend.

## Tech Stack

- Backend: .NET 8 / ASP.NET Core Web API
- Database: EF Core + SQLite
- Frontend: React + TypeScript + Vite
- Authentication: local cookie authentication
- Tests: xUnit integration tests

## Prerequisites

- .NET 8 SDK
- Node.js and npm

## Running Locally

Run the backend and frontend in separate terminals.

### Backend

```bash
cd backend/TodoTakehome.Api
dotnet run
```

The API runs at:

```text
https://localhost:7043
```

If the local HTTPS certificate is not trusted yet, run:

```bash
dotnet dev-certs https --trust
```

Swagger is available in Development at:

```text
https://localhost:7043/swagger
```

### Frontend

```bash
cd frontend/todo-takehome-ui
npm install
cp .env.example .env.local
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend reads the API URL from `VITE_API_BASE_URL`. The committed `.env.example` points at the local backend:

```text
VITE_API_BASE_URL=https://localhost:7043
```

## Database

The app uses SQLite through EF Core.

The default local database path is:

```text
backend/TodoTakehome.Api/App_Data/todo-takehome.db
```

In Development, migrations are applied automatically on API startup so the app can be run locally without a manual database setup step. Local database files are ignored by git.

## Verification

Run backend build and tests:

```bash
dotnet test
```

Run frontend build:

```bash
cd frontend/todo-takehome-ui
npm run build
```

Current local verification:

```text
dotnet test: 18 tests passed
npm run build: passed
```

## What Was Built

- User registration, login, logout, and current-user lookup.
- Cookie-based authenticated API requests.
- Task create, list, edit, delete, and complete/incomplete.
- Per-user task ownership enforcement.
- Frontend task management UI with loading, empty, and error states.
- Client-side task form validation for required title and length limits.
- Server-side task validation for required/whitespace title and length limits.
- Visible API validation errors without clearing form input.
- Client-side show/hide completed task toggle.
- Backend integration tests for auth, validation, CRUD, and ownership isolation.

## API Summary

Auth endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Task endpoints:

```text
GET    /api/tasks
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
DELETE /api/tasks/{id}
PATCH  /api/tasks/{id}/complete
```

All task endpoints require authentication. Task reads and mutations are scoped to the authenticated user. Requests for another user's task return `404 Not Found` to avoid leaking that the task exists.

## Implementation Notes

- EF Core is used directly through `AppDbContext`; there is no repository abstraction.
- DTOs are used for API requests and responses.
- Passwords are hashed with ASP.NET Core Identity password hashing.
- Due dates use `DateOnly` in the backend to avoid accidental timezone shifts.
- Task timestamps use UTC.
- CORS is configured for the local Vite frontend origin in Development.
- The frontend uses a small typed `fetch` API client and cookie credentials.

## Tradeoffs and Assumptions

- Authentication is intentionally local and simple for the assignment scope.
- The app uses cookie auth, but does not implement password reset, email verification, refresh tokens, or rate limiting.
- Backend integration tests cover the highest-risk behavior. A frontend test suite was not added.
- SQLite keeps local setup simple for the assignment.
- The UI is intentionally simple and task-focused.
- No deployment, CI/CD, Docker, or monitoring infrastructure is included.

## Future Improvements

With more time, the next production-oriented additions would be:

- Password reset and email verification.
- Stronger password policy and auth rate limiting.
- Pagination for larger task lists.
- Tagging and richer task filtering.
- Playwright end-to-end tests for register/login/task flows.
- Frontend accessibility pass.
- CI pipeline for backend tests and frontend build.
- Structured logging and global exception handling improvements.
- Deployment configuration.
- More robust production database configuration and backup strategy.
