create or replace function public.get_or_create_default_wallet()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select w.id
    into v_wallet_id
    from public.wallets as w
   where w.user_id = v_user_id
   order by w.created_at
   limit 1;

  if v_wallet_id is null then
    insert into public.wallets (user_id, name)
    values (v_user_id, 'Carteira principal')
    returning id into v_wallet_id;
  end if;

  return v_wallet_id;
end;
$$;

create or replace function public.record_buy_transaction(
  p_ticker text,
  p_name text,
  p_segment text,
  p_quantity numeric,
  p_unit_price numeric,
  p_occurred_at date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_transaction_id uuid;
  v_user_id uuid := auth.uid();
  v_current_quantity numeric;
  v_current_average numeric;
  v_next_quantity numeric;
  v_next_average numeric;
  v_ticker text := upper(trim(p_ticker));
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_quantity <= 0 or p_unit_price <= 0 then
    raise exception 'Quantidade e preco devem ser maiores que zero';
  end if;

  insert into public.fiis (ticker, name, segment, source)
  values (v_ticker, coalesce(nullif(trim(p_name), ''), v_ticker), nullif(trim(p_segment), ''), 'market')
  on conflict (ticker) do update set
    name = excluded.name,
    segment = coalesce(excluded.segment, public.fiis.segment),
    updated_at = now();

  v_wallet_id := public.get_or_create_default_wallet();

  insert into public.transactions (wallet_id, user_id, ticker, type, quantity, unit_price, occurred_at)
  values (v_wallet_id, v_user_id, v_ticker, 'buy', p_quantity, p_unit_price, coalesce(p_occurred_at, current_date))
  returning id into v_transaction_id;

  select wp.quantity, wp.average_price
    into v_current_quantity, v_current_average
    from public.wallet_positions as wp
   where wp.wallet_id = v_wallet_id
     and wp.user_id = v_user_id
     and wp.ticker = v_ticker;

  if v_current_quantity is null then
    insert into public.wallet_positions (wallet_id, user_id, ticker, quantity, average_price)
    values (v_wallet_id, v_user_id, v_ticker, p_quantity, p_unit_price);
  else
    v_next_quantity := v_current_quantity + p_quantity;
    v_next_average := ((v_current_quantity * v_current_average) + (p_quantity * p_unit_price)) / v_next_quantity;

    update public.wallet_positions as wp
       set quantity = v_next_quantity,
           average_price = v_next_average
     where wp.wallet_id = v_wallet_id
       and wp.user_id = v_user_id
       and wp.ticker = v_ticker;
  end if;

  return v_transaction_id;
end;
$$;

create or replace function public.delete_wallet_position(p_ticker text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_user_id uuid := auth.uid();
  v_ticker text := upper(trim(p_ticker));
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  v_wallet_id := public.get_or_create_default_wallet();

  delete from public.wallet_positions as wp
   where wp.wallet_id = v_wallet_id
     and wp.user_id = v_user_id
     and wp.ticker = v_ticker;
end;
$$;

create or replace function public.complete_onboarding(
  p_full_name text,
  p_investor_profile text,
  p_monthly_income_goal numeric,
  p_wallet_name text,
  p_positions jsonb default '[]'::jsonb,
  p_skipped boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_user_id uuid := auth.uid();
  v_position jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  v_wallet_id := public.get_or_create_default_wallet();

  update public.wallets as w
     set name = coalesce(nullif(trim(p_wallet_name), ''), 'Carteira principal')
   where w.id = v_wallet_id
     and w.user_id = v_user_id;

  if not p_skipped then
    for v_position in
      select value from jsonb_array_elements(coalesce(p_positions, '[]'::jsonb))
    loop
      perform public.record_buy_transaction(
        v_position ->> 'ticker',
        coalesce(v_position ->> 'name', v_position ->> 'ticker'),
        coalesce(v_position ->> 'segment', 'Sem segmento'),
        nullif(v_position ->> 'quantity', '')::numeric,
        nullif(v_position ->> 'average_price', '')::numeric,
        current_date
      );
    end loop;
  end if;

  insert into public.profiles (
    id,
    full_name,
    investor_profile,
    monthly_income_goal,
    onboarding_completed_at,
    onboarding_skipped_at
  )
  values (
    v_user_id,
    nullif(trim(p_full_name), ''),
    coalesce(nullif(trim(p_investor_profile), ''), 'moderado'),
    coalesce(p_monthly_income_goal, 0),
    case when p_skipped then null else now() end,
    case when p_skipped then now() else null end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    investor_profile = excluded.investor_profile,
    monthly_income_goal = excluded.monthly_income_goal,
    onboarding_completed_at = excluded.onboarding_completed_at,
    onboarding_skipped_at = excluded.onboarding_skipped_at,
    updated_at = now();
end;
$$;

grant execute on function public.get_or_create_default_wallet() to authenticated;
grant execute on function public.record_buy_transaction(text, text, text, numeric, numeric, date) to authenticated;
grant execute on function public.delete_wallet_position(text) to authenticated;
grant execute on function public.complete_onboarding(text, text, numeric, text, jsonb, boolean) to authenticated;
