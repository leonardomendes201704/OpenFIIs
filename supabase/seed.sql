insert into public.fiis (ticker, name, segment, source)
values
  ('HGLG11', 'CSHG Logística', 'Logística', 'seed'),
  ('KNRI11', 'Kinea Renda Imobiliária', 'Híbrido', 'seed'),
  ('MXRF11', 'Maxi Renda', 'Papel', 'seed'),
  ('XPML11', 'XP Malls', 'Shoppings', 'seed'),
  ('VISC11', 'Vinci Shopping Centers', 'Shoppings', 'seed'),
  ('RBRR11', 'RBR Rendimentos High Grade', 'Papel', 'seed')
on conflict (ticker) do update set
  name = excluded.name,
  segment = excluded.segment,
  source = excluded.source,
  updated_at = now();
