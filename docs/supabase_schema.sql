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

-- Auth profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Profile adjustments for finance/auth
alter table profiles
  add column if not exists class_key text,
  add column if not exists appearance_id integer,
  add column if not exists starting_balance_cents bigint default 0;

-- Accounts and balances
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  account_type text not null check (account_type in ('checking','savings')),
  currency text default 'BRL',
  created_at timestamp with time zone default now(),
  unique (user_id, account_type)
);

create table if not exists balances (
  account_id uuid primary key references accounts(id) on delete cascade,
  available_cents bigint not null default 0,
  updated_at timestamp with time zone default now()
);

-- Transactions adjustments
alter table transactions
  add column if not exists kind text check (kind in ('income','expense','transfer','savings_deposit','savings_withdraw')),
  add column if not exists amount_cents bigint,
  add column if not exists description text,
  add column if not exists occurred_at timestamptz default now(),
  add column if not exists client_generated_id uuid;

create unique index if not exists transactions_client_generated_id_idx
  on transactions (user_id, client_generated_id)
  where client_generated_id is not null;

-- Ledger entries
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  transaction_id uuid references transactions(id),
  account_id uuid references accounts(id),
  delta_cents bigint not null,
  created_at timestamp with time zone default now()
);

-- Missions updates
alter table missions
  add column if not exists target_cents bigint,
  add column if not exists saved_cents bigint default 0;

-- Mission contributions
create table if not exists mission_contributions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id),
  user_id uuid references profiles(id),
  amount_cents bigint not null,
  created_at timestamp with time zone default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table balances enable row level security;
alter table transactions enable row level security;
alter table ledger_entries enable row level security;
alter table missions enable row level security;
alter table mission_contributions enable row level security;

create policy if not exists "profiles self" on profiles
  for select using (id = auth.uid());
create policy if not exists "profiles update" on profiles
  for update using (id = auth.uid());

create policy if not exists "accounts owner" on accounts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "balances owner" on balances
  for all using (
    account_id in (select id from accounts where user_id = auth.uid())
  )
  with check (
    account_id in (select id from accounts where user_id = auth.uid())
  );

create policy if not exists "transactions owner" on transactions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "ledger owner" on ledger_entries
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "missions owner" on missions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "mission contributions owner" on mission_contributions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Helper to fetch account
create or replace function public.get_account_id(p_user_id uuid, p_account_type text)
returns uuid
language sql
stable
as $$
  select id from accounts where user_id = p_user_id and account_type = p_account_type limit 1;
$$;

-- Initialize accounts
create or replace function public.rpc_initialize_accounts(p_initial_balance_cents bigint)
returns setof accounts
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_checking_id uuid;
  v_savings_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into accounts (user_id, name, account_type)
  values
    (v_user_id, 'Pouch', 'checking'),
    (v_user_id, 'Vault', 'savings')
  on conflict (user_id, account_type) do nothing;

  v_checking_id := get_account_id(v_user_id, 'checking');
  v_savings_id := get_account_id(v_user_id, 'savings');

  insert into balances (account_id, available_cents)
  values
    (v_checking_id, p_initial_balance_cents),
    (v_savings_id, 0)
  on conflict (account_id) do update
    set available_cents = excluded.available_cents,
        updated_at = now();

  return query
    select * from accounts where user_id = v_user_id;
end;
$$;

-- Create income
create or replace function public.rpc_create_income(
  p_amount_cents bigint,
  p_description text,
  p_occurred_at timestamptz,
  p_category text,
  p_client_generated_id uuid
) returns transactions
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_checking_id uuid;
  v_balance bigint;
  v_tx transactions;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_checking_id := get_account_id(v_user_id, 'checking');
  if v_checking_id is null then
    raise exception 'Checking account missing';
  end if;

  select available_cents into v_balance from balances
    where account_id = v_checking_id for update;

  insert into transactions (user_id, kind, amount_cents, category, description, occurred_at, client_generated_id)
  values (v_user_id, 'income', p_amount_cents, p_category, p_description, coalesce(p_occurred_at, now()), p_client_generated_id)
  returning * into v_tx;

  insert into ledger_entries (user_id, transaction_id, account_id, delta_cents)
  values (v_user_id, v_tx.id, v_checking_id, p_amount_cents);

  update balances
    set available_cents = v_balance + p_amount_cents,
        updated_at = now()
    where account_id = v_checking_id;

  return v_tx;
end;
$$;

-- Create expense
create or replace function public.rpc_create_expense(
  p_amount_cents bigint,
  p_description text,
  p_occurred_at timestamptz,
  p_category text,
  p_client_generated_id uuid
) returns transactions
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_checking_id uuid;
  v_balance bigint;
  v_tx transactions;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_checking_id := get_account_id(v_user_id, 'checking');
  if v_checking_id is null then
    raise exception 'Checking account missing';
  end if;

  select available_cents into v_balance from balances
    where account_id = v_checking_id for update;

  insert into transactions (user_id, kind, amount_cents, category, description, occurred_at, client_generated_id)
  values (v_user_id, 'expense', p_amount_cents, p_category, p_description, coalesce(p_occurred_at, now()), p_client_generated_id)
  returning * into v_tx;

  insert into ledger_entries (user_id, transaction_id, account_id, delta_cents)
  values (v_user_id, v_tx.id, v_checking_id, -p_amount_cents);

  update balances
    set available_cents = v_balance - p_amount_cents,
        updated_at = now()
    where account_id = v_checking_id;

  return v_tx;
end;
$$;

-- Deposit to savings
create or replace function public.rpc_deposit_to_savings(
  p_amount_cents bigint,
  p_mission_id uuid,
  p_client_generated_id uuid
) returns transactions
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_checking_id uuid;
  v_savings_id uuid;
  v_checking_balance bigint;
  v_savings_balance bigint;
  v_tx transactions;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_checking_id := get_account_id(v_user_id, 'checking');
  v_savings_id := get_account_id(v_user_id, 'savings');

  select available_cents into v_checking_balance from balances
    where account_id = v_checking_id for update;
  select available_cents into v_savings_balance from balances
    where account_id = v_savings_id for update;

  insert into transactions (user_id, kind, amount_cents, description, occurred_at, client_generated_id)
  values (v_user_id, 'savings_deposit', p_amount_cents, 'Savings deposit', now(), p_client_generated_id)
  returning * into v_tx;

  insert into ledger_entries (user_id, transaction_id, account_id, delta_cents)
  values
    (v_user_id, v_tx.id, v_checking_id, -p_amount_cents),
    (v_user_id, v_tx.id, v_savings_id, p_amount_cents);

  update balances
    set available_cents = v_checking_balance - p_amount_cents,
        updated_at = now()
    where account_id = v_checking_id;

  update balances
    set available_cents = v_savings_balance + p_amount_cents,
        updated_at = now()
    where account_id = v_savings_id;

  if p_mission_id is not null then
    insert into mission_contributions (mission_id, user_id, amount_cents)
    values (p_mission_id, v_user_id, p_amount_cents);

    update missions
      set saved_cents = coalesce(saved_cents, 0) + p_amount_cents,
          status = case when coalesce(saved_cents, 0) + p_amount_cents >= target_cents then 'completed' else status end
      where id = p_mission_id and user_id = v_user_id;
  end if;

  return v_tx;
end;
$$;

-- Withdraw from savings
create or replace function public.rpc_withdraw_from_savings(
  p_amount_cents bigint,
  p_client_generated_id uuid
) returns transactions
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_checking_id uuid;
  v_savings_id uuid;
  v_checking_balance bigint;
  v_savings_balance bigint;
  v_tx transactions;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_checking_id := get_account_id(v_user_id, 'checking');
  v_savings_id := get_account_id(v_user_id, 'savings');

  select available_cents into v_checking_balance from balances
    where account_id = v_checking_id for update;
  select available_cents into v_savings_balance from balances
    where account_id = v_savings_id for update;

  insert into transactions (user_id, kind, amount_cents, description, occurred_at, client_generated_id)
  values (v_user_id, 'savings_withdraw', p_amount_cents, 'Savings withdraw', now(), p_client_generated_id)
  returning * into v_tx;

  insert into ledger_entries (user_id, transaction_id, account_id, delta_cents)
  values
    (v_user_id, v_tx.id, v_checking_id, p_amount_cents),
    (v_user_id, v_tx.id, v_savings_id, -p_amount_cents);

  update balances
    set available_cents = v_checking_balance + p_amount_cents,
        updated_at = now()
    where account_id = v_checking_id;

  update balances
    set available_cents = v_savings_balance - p_amount_cents,
        updated_at = now()
    where account_id = v_savings_id;

  return v_tx;
end;
$$;

-- Unified transaction RPC
create or replace function public.rpc_create_transaction(
  p_amount_cents bigint,
  p_category text,
  p_description text,
  p_occurred_at timestamptz,
  p_kind text,
  p_client_generated_id uuid
) returns transactions
language plpgsql
security definer
as $$
begin
  if p_kind = 'income' then
    return rpc_create_income(p_amount_cents, p_description, p_occurred_at, p_category, p_client_generated_id);
  elsif p_kind = 'expense' then
    return rpc_create_expense(p_amount_cents, p_description, p_occurred_at, p_category, p_client_generated_id);
  else
    raise exception 'Unsupported kind';
  end if;
end;
$$;
