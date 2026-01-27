# Dwarven Guild (Finance Tracker MVP)

Prototype for the “Dwarven Guild” gamified personal finance app.

## Structure

- `frontend/` — React + Vite UI with Zustand + TanStack Query.
- `backend/` — Express REST API integrating Supabase.
- `docs/` — Supabase schema draft.

## Quick start

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend expects `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in the `.env`.
