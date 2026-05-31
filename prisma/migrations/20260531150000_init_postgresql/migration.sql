create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  investor_profile text not null default 'moderado',
  monthly_income_goal numeric(14, 2) not null default 0,
  max_asset_allocation numeric(5, 2) not null default 20,
  onboarding_completed_at timestamptz,
  onboarding_skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'Carteira principal',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fiis (
  ticker text primary key,
  name text not null,
  segment text,
  administrator text,
  manager text,
  cnpj text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null,
  ticker text not null references public.fiis(ticker),
  type text not null check (type in ('buy', 'sell', 'dividend')),
  quantity numeric(18, 6) not null default 0,
  unit_price numeric(14, 4) not null default 0,
  gross_amount numeric(14, 2) not null default 0,
  occurred_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null,
  ticker text not null references public.fiis(ticker),
  quantity numeric(18, 6) not null default 0,
  average_price numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, ticker)
);

create table if not exists public.fii_quotes (
  id uuid primary key default gen_random_uuid(),
  ticker text not null references public.fiis(ticker) on delete cascade,
  quote_date date not null,
  open numeric(14, 4),
  high numeric(14, 4),
  low numeric(14, 4),
  close numeric(14, 4),
  volume numeric(18, 2),
  source text not null,
  created_at timestamptz not null default now(),
  unique (ticker, quote_date, source)
);

create table if not exists public.dividends (
  id uuid primary key default gen_random_uuid(),
  ticker text not null references public.fiis(ticker) on delete cascade,
  amount_per_share numeric(14, 6) not null,
  base_date date,
  payment_date date,
  type text,
  source text not null,
  created_at timestamptz not null default now(),
  unique (ticker, amount_per_share, base_date, payment_date, source)
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_id uuid,
  name text not null,
  scenario text not null default 'base',
  initial_equity numeric(14, 2) not null default 0,
  monthly_contribution numeric(14, 2) not null default 0,
  years integer not null default 15,
  reinvest_dividends boolean not null default true,
  assumptions jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_id uuid,
  name text not null,
  report_type text not null,
  format text not null default 'pdf',
  status text not null default 'ready',
  period_start date,
  period_end date,
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists transactions_wallet_id_idx on public.transactions(wallet_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_ticker_idx on public.transactions(ticker);
create index if not exists wallet_positions_wallet_id_idx on public.wallet_positions(wallet_id);
create index if not exists wallet_positions_user_id_idx on public.wallet_positions(user_id);
create index if not exists fii_quotes_ticker_date_idx on public.fii_quotes(ticker, quote_date desc);
create index if not exists dividends_ticker_payment_idx on public.dividends(ticker, payment_date desc);
create index if not exists simulations_user_id_idx on public.simulations(user_id);
create index if not exists reports_user_id_idx on public.reports(user_id);
