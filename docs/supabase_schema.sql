create table if not exists profiles (
  id uuid primary key,
  email text,
  display_name text,
  class text,
  appearance_id text,
  starting_balance numeric,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists game_state (
  user_id uuid primary key references profiles(id),
  xp integer default 0,
  level integer default 1,
  gold integer default 0,
  streak_count integer default 0,
  streak_last_date date,
  updated_at timestamp with time zone default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  amount numeric,
  category text,
  occurred_at date,
  created_at timestamp with time zone default now(),
  note text
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text,
  target_amount numeric,
  current_amount numeric,
  status text,
  reward_xp integer,
  reward_gold integer,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table if not exists shop_items (
  id uuid primary key default gen_random_uuid(),
  name text,
  category text,
  price_gold integer,
  asset_url text,
  is_active boolean default true
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  shop_item_id uuid references shop_items(id),
  purchased_at timestamp with time zone default now()
);

create table if not exists counselor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text,
  body text,
  sent_at timestamp with time zone default now(),
  read_at timestamp with time zone,
  created_by_admin uuid
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  props jsonb,
  created_at timestamp with time zone default now()
);
