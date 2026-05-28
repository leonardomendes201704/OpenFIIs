create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  investor_profile text not null default 'moderado',
  monthly_income_goal numeric(14, 2) not null default 0,
  max_asset_allocation numeric(5, 2) not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null references public.fiis(ticker),
  type text not null check (type in ('buy', 'sell', 'dividend')),
  quantity numeric(18, 6) not null default 0,
  unit_price numeric(14, 4) not null default 0,
  gross_amount numeric(14, 2) generated always as (round((quantity * unit_price)::numeric, 2)) stored,
  occurred_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
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

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger fiis_set_updated_at
before update on public.fiis
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger wallet_positions_set_updated_at
before update on public.wallet_positions
for each row execute function public.set_updated_at();

create trigger simulations_set_updated_at
before update on public.simulations
for each row execute function public.set_updated_at();

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_positions enable row level security;
alter table public.simulations enable row level security;
alter table public.reports enable row level security;
alter table public.fiis enable row level security;
alter table public.fii_quotes enable row level security;
alter table public.dividends enable row level security;

create policy "profiles are owned by users"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "wallets are owned by users"
on public.wallets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "transactions are owned by users"
on public.transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "positions are owned by users"
on public.wallet_positions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "simulations are owned by users"
on public.simulations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "reports are owned by users"
on public.reports for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users can read fiis"
on public.fiis for select
to authenticated
using (true);

create policy "authenticated users can read fii quotes"
on public.fii_quotes for select
to authenticated
using (true);

create policy "authenticated users can read dividends"
on public.dividends for select
to authenticated
using (true);

create policy "service role manages fiis"
on public.fiis for all
to service_role
using (true)
with check (true);

create policy "service role manages quotes"
on public.fii_quotes for all
to service_role
using (true)
with check (true);

create policy "service role manages dividends"
on public.dividends for all
to service_role
using (true)
with check (true);
