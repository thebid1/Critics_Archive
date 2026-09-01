-- CRITICS ARCHIVE — Drop 001 seed data (mirrors lib/mock-products.ts fallback).
-- Intended to run after supabase/schema.sql (db:reset drops tables first).
-- Currency: NGN (naira). created_at is staggered so catalogue ordering
-- (created_at ASC) matches the editorial order in lib/mock-products.ts.

insert into products (slug, name, price, currency, description, stock, drop_name, season, is_new, is_published, created_at) values
  ('black-runway-url-tee',            'BLACK RUNWAY URL TEE',            25000, 'NGN', 'Black heavyweight tee, boxy fit, runway URL graphic across the chest.',                50, 'Drop 001', 'SS26', true, true,  now() - interval '8 minutes'),
  ('white-runway-url-tee',            'WHITE RUNWAY URL TEE',            25000, 'NGN', 'White heavyweight tee, boxy fit, runway URL graphic across the chest.',                50, 'Drop 001', 'SS26', true, true,  now() - interval '7 minutes'),
  ('black-swag-is-art-shorts',        'BLACK SWAG IS ART SHORTS',        25000, 'NGN', 'Black relaxed-fit shorts with a tonal SWAG IS ART repeat in the waistband.',            50, 'Drop 001', 'SS26', true, true,  now() - interval '6 minutes'),
  ('swag-is-art-hoodie-scarf',        'SWAG IS ART HOODIE SCARF',        20000, 'NGN', 'A hoodie-detailed scarf — one statement piece with the archive wordmark woven through.', 50, 'Drop 001', 'SS26', true, true,  now() - interval '5 minutes'),
  ('crt-domain-expansion-white-tee',  'CRT DOMAIN EXPANSION WHITE TEE',  25000, 'NGN', 'CRT-flare graphic tee, domain-expansion print across the back, oversized cut.',          50, 'Drop 001', 'SS26', true, true,  now() - interval '4 minutes'),
  ('crt-domain-expansion-black-tee',  'CRT DOMAIN EXPANSION BLACK TEE',  25000, 'NGN', 'Swag is Art tee with a tonal repeat of the archive wordmark woven through.',            50, 'Drop 001', 'SS26', true, true,  now() - interval '3 minutes'),
  ('sia-hoodie',                      'SIA - HOODIE',                    35000, 'NGN', 'CRITICS hoodie with a tonal repeat of the archive wordmark woven through.',             50, 'Drop 001', 'SS26', true, true,  now() - interval '2 minutes'),
  ('sia-sweatpants',                  'SIA - SWEATPANTS',                30000, 'NGN', 'Swag is Art sweatpants with a tonal repeat of the archive wordmark woven through.',     50, 'Drop 001', 'SS26', true, true,  now() - interval '1 minute');

-- Primary images (position 0 = card image). More angles can be added later.
insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/Black_Runaway_Tee_pxs9fw.png', 0
from products where slug = 'black-runway-url-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/White_Runaway_Tee_ku1lsz.png', 0
from products where slug = 'white-runway-url-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_Swag_Short_ahw3ao.png', 0
from products where slug = 'black-swag-is-art-shorts';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/SWAG_IS_ART_-_hoodie_i6xezo.png', 0
from products where slug = 'swag-is-art-hoodie-scarf';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858885/crt_domain_eqhsue.png', 0
from products where slug = 'crt-domain-expansion-white-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1788066779/CRT_Domain_Expansion_Black_Tee_y7fruy.png', 0
from products where slug = 'crt-domain-expansion-black-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/SIA_Hoodie_abjlpm.png', 0
from products where slug = 'sia-hoodie';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1788066154/SIA_Sweatpant_ue13go.png', 0
from products where slug = 'sia-sweatpants';

-- Product sizes (purchase options ONLY — inventory is product-level, products.stock).
-- Tees: S–XXL · Shorts: L–XXL · Hoodie: S–XX · Sweatpants: S–XXL · Scarf: OS.
insert into product_variants (product_id, size)
select id, s.size
from products
cross join (values
  ('S'), ('M'), ('L'), ('XL'), ('XXL')
) as s(size)
where slug in ('black-runway-url-tee', 'white-runway-url-tee', 'crt-domain-expansion-white-tee', 'crt-domain-expansion-black-tee');

insert into product_variants (product_id, size)
select id, s.size
from products
cross join (values
  ('L'), ('XL'), ('XXL')
) as s(size)
where slug = 'black-swag-is-art-shorts';

insert into product_variants (product_id, size)
select id, s.size
from products
cross join (values
  ('S'), ('M'), ('L'), ('XL'), ('XX')
) as s(size)
where slug = 'sia-hoodie';

insert into product_variants (product_id, size)
select id, s.size
from products
cross join (values
  ('S'), ('M'), ('L'), ('XL'), ('XXL')
) as s(size)
where slug = 'sia-sweatpants';

insert into product_variants (product_id, size)
select id, 'OS'
from products where slug = 'swag-is-art-hoodie-scarf';