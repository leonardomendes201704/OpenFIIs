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
  wallet_id uuid;
  current_user_id uuid := auth.uid();
  position jsonb;
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  wallet_id := public.get_or_create_default_wallet();

  update public.wallets
     set name = coalesce(nullif(trim(p_wallet_name), ''), 'Carteira principal')
   where id = wallet_id
     and user_id = current_user_id;

  if not p_skipped then
    for position in
      select value from jsonb_array_elements(coalesce(p_positions, '[]'::jsonb))
    loop
      perform public.record_buy_transaction(
        position ->> 'ticker',
        coalesce(position ->> 'name', position ->> 'ticker'),
        coalesce(position ->> 'segment', 'Sem segmento'),
        nullif(position ->> 'quantity', '')::numeric,
        nullif(position ->> 'average_price', '')::numeric,
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
    current_user_id,
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

grant execute on function public.complete_onboarding(text, text, numeric, text, jsonb, boolean) to authenticated;
