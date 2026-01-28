#!/usr/bin/env bash
set -euo pipefail

# Dwarven Guild MVP starter repo generator
# Usage:
#   mkdir dwarven-guild-mvp-starter && cd $_
#   bash init.sh
#
# After running:
#   npm install
#   cp apps/web/.env.example apps/web/.env
#   cp apps/api/.env.example apps/api/.env
#   npm run dev

ROOT="dwarven-guild-mvp-starter"

mkdir -p "$ROOT"
cd "$ROOT"

mkdir -p \
  apps/api/src \
  apps/web/src/components \
  apps/web/src/lib \
  apps/web/src/pages \
  apps/web/src/store \
  packages/shared/src \
  supabase/migrations \
  supabase/seed \
  docs

cat > PROMPT.txt <<'EOF'
Dwarven Guild MVP — Developer Handoff Prompt / Spec
===================================================

0) Product identity (what we’re building)
Build “Dwarven Guild”, a gamified personal finance web app for teens/young adults (16–25), especially gamers in Brazil.
Core idea: turn manual expense logging into an RPG loop (XP/levels, gold, missions, cosmetics) to build healthy habits.

1) MVP scope (Primeira Expedição)
Functional requirements:
RF01: Signup/login (email + Google).
RF02: Avatar creation (3 classes, 5 appearances).
RF03: Manual transaction logging with 6 categories.
RF04: Gamified dashboard (balance, XP, level, animated avatar).
RF05: Missions/goals system (max 3 active missions).
RF06: Basic shop (10 cosmetic items) purchasable with virtual currency.
RF07: “Guild Counselor” notifications (Mágico de Oz/manual; NOT real AI).

Explicitly excluded from MVP:
- Bank/Open Banking integration.
- Guilds/social systems.
- Real AI.

2) Key screens
- Onboarding: welcome → choose class → customize → starting balance → guided log.
- Dashboard: XP/level, gold, avatar, counselor message, “financial health” bar, quick add transaction.
- Transaction logging: keypad amount, category picker, immediate XP/gold feedback.
- Missions: create/track goals, max 3 active, progress, completion rewards.
- Shop: 10 cosmetics, gold-only purchases.
- Inbox: counselor messages list + read.

3) Gamification primitives
- XP + leveling
- Gold currency
- Streaks: increments when ≥1 transaction is logged in a day (local timezone). Break resets streak.

4) Counselor (Wizard-of-Oz)
Admin-only tool to:
- list users + simple stats (last activity, streak, 7-day category totals)
- send a counselor message stored in DB and delivered in-app

5) Stack + architecture
Frontend: React (Vite), React Router, TanStack Query, Zustand.
Backend: Node.js + Express (REST).
DB/Auth: Supabase (preferred) OR Firebase.
Recommendation: Supabase for relational data (transactions/missions/shop), built-in auth + RLS.

6) Minimum data model (Supabase/Postgres suggestion)
profiles(id uuid=auth uid, email, display_name, class, appearance_id, starting_balance, settings jsonb, created_at)
game_state(user_id, xp, level, gold, streak_count, streak_last_date, updated_at)
transactions(id, user_id, amount, category, occurred_at, created_at, note)
missions(id, user_id, title, target_amount, current_amount, status, reward_xp, reward_gold, created_at, completed_at)
shop_items(id, name, category, price_gold, asset_url, is_active)
purchases(id, user_id, shop_item_id, purchased_at)
counselor_messages(id, user_id, title, body, sent_at, read_at, created_by_admin)
events(id, user_id nullable, name, props jsonb, created_at)

7) REST endpoints (Express)
GET /health
GET /me
PATCH /me/settings
POST /avatar
POST /transactions
GET /transactions?from&to
POST /missions (enforce max 3 active)
GET /missions
POST /missions/:id/complete
GET /shop/items
POST /shop/buy
GET /counselor/messages
POST /counselor/messages/:id/read
POST /admin/counselor/send (admin-only)
POST /events

8) Business rules
- XP and gold rewards configurable (e.g., XP_PER_TX=50).
- Missions: max 3 active; completing grants rewards.
- Discrete mode: hides heavy animations while keeping function.

9) Definition of Done (MVP)
- Onboard → create avatar → set starting balance → log transaction.
- Logging updates transactions, XP/level, gold, streak, dashboard.
- Missions create/complete + rewards.
- Shop purchase + ownership.
- Counselor admin can send; user reads in-app.
- Analytics events recorded.
EOF

cat > README.md <<'EOF'
