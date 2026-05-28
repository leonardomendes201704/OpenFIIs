create or replace function public.get_or_create_default_wallet()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select id
    into wallet_id
    from public.wallets
   where user_id = current_user_id
   order by created_at
   limit 1;

  if wallet_id is null then
    insert into public.wallets (user_id, name)
    values (current_user_id, 'Carteira principal')
    returning id into wallet_id;
  end if;

  return wallet_id;
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
  wallet_id uuid;
  transaction_id uuid;
  current_user_id uuid := auth.uid();
  current_quantity numeric;
  current_average numeric;
  next_quantity numeric;
  next_average numeric;
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_quantity <= 0 or p_unit_price <= 0 then
    raise exception 'Quantidade e preço devem ser maiores que zero';
  end if;

  insert into public.fiis (ticker, name, segment, source)
  values (upper(trim(p_ticker)), coalesce(nullif(trim(p_name), ''), upper(trim(p_ticker))), nullif(trim(p_segment), ''), 'market')
  on conflict (ticker) do update set
    name = excluded.name,
    segment = coalesce(excluded.segment, public.fiis.segment),
    updated_at = now();

  wallet_id := public.get_or_create_default_wallet();

  insert into public.transactions (wallet_id, user_id, ticker, type, quantity, unit_price, occurred_at)
  values (wallet_id, current_user_id, upper(trim(p_ticker)), 'buy', p_quantity, p_unit_price, coalesce(p_occurred_at, current_date))
  returning id into transaction_id;

  select quantity, average_price
    into current_quantity, current_average
    from public.wallet_positions
   where wallet_positions.wallet_id = wallet_id
     and wallet_positions.user_id = current_user_id
     and wallet_positions.ticker = upper(trim(p_ticker));

  if current_quantity is null then
    insert into public.wallet_positions (wallet_id, user_id, ticker, quantity, average_price)
    values (wallet_id, current_user_id, upper(trim(p_ticker)), p_quantity, p_unit_price);
  else
    next_quantity := current_quantity + p_quantity;
    next_average := ((current_quantity * current_average) + (p_quantity * p_unit_price)) / next_quantity;

    update public.wallet_positions
       set quantity = next_quantity,
           average_price = next_average
     where wallet_positions.wallet_id = wallet_id
       and wallet_positions.user_id = current_user_id
       and wallet_positions.ticker = upper(trim(p_ticker));
  end if;

  return transaction_id;
end;
$$;

create or replace function public.delete_wallet_position(p_ticker text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  wallet_id := public.get_or_create_default_wallet();

  delete from public.wallet_positions
   where wallet_positions.wallet_id = wallet_id
     and wallet_positions.user_id = current_user_id
     and wallet_positions.ticker = upper(trim(p_ticker));
end;
$$;

grant execute on function public.get_or_create_default_wallet() to authenticated;
grant execute on function public.record_buy_transaction(text, text, text, numeric, numeric, date) to authenticated;
grant execute on function public.delete_wallet_position(text) to authenticated;
