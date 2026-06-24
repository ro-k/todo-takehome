# Todo Takehome

Small full-stack task management app.

## Tech Stack

- Backend: .NET 8 / ASP.NET Core
- Database: EF Core + SQLite
- Frontend: React + TypeScript + Vite
- Tests: xUnit

## Running Locally

### Backend

```bash
cd backend/TodoTakehome.Api
dotnet run
```

### Frontend

```bash
cd frontend/todo-takehome-ui
npm install
npm run dev
```

The frontend reads its API URL from `VITE_API_BASE_URL`. Use `.env.example` as the starting point for local environment configuration.

## Build Checks

```bash
dotnet build
```

```bash
cd frontend/todo-takehome-ui
npm run build
```
