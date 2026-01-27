create table if not exists profiles (
  id uuid primary key,
  email text,
  display_name text,
  class text,
  appearance_id text,
  starting_balance numeric,
  title_code text,
  timezone text,
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
  slot text,
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

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  shop_item_id uuid references shop_items(id),
  acquired_at timestamp with time zone default now()
);

create table if not exists equipment (
  user_id uuid references profiles(id),
  slot text,
  shop_item_id uuid references shop_items(id),
  updated_at timestamp with time zone default now(),
  primary key (user_id, slot)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  month text,
  category text,
  limit_amount numeric,
  created_at timestamp with time zone default now(),
  unique (user_id, month, category)
);

create table if not exists budget_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  month text,
  category text,
  awarded_at timestamp with time zone default now(),
  unique (user_id, month, category)
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text,
  description text,
  icon text
);

create table if not exists user_achievements (
  user_id uuid references profiles(id),
  achievement_id uuid references achievements(id),
  unlocked_at timestamp with time zone default now(),
  primary key (user_id, achievement_id)
);

insert into achievements (code, name, description, icon) values
  ('first-log', 'First Log', 'Record your very first expense.', 'scroll'),
  ('streak-7', '7-Day Streak', 'Log expenses seven days in a row.', 'flame'),
  ('budget-keeper', 'Budget Keeper', 'Stay within three monthly budgets.', 'shield'),
  ('guild-treasurer', 'Guild Treasurer', 'Reach 50 total transactions.', 'vault'),
  ('armory-collector', 'Armory Collector', 'Own five cosmetics from the Armory.', 'hammer'),
  ('steady-hand', 'Steady Hand', 'Maintain a 3-day streak.', 'anvil')
on conflict (code) do nothing;

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
