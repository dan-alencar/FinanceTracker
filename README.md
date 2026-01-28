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

The backend expects `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_ANON_KEY` in the `.env`.

### Supabase configuration

Fill in the Supabase values in both `frontend/.env` and `backend/.env`:

- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`

With these set, email/password auth will use Supabase instead of the demo fallback.
