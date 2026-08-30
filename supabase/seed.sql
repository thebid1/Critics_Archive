-- CRITICS ARCHIVE — Drop 001 seed data (mirrors lib/mock-products.ts fallback).
-- Intended to run after supabase/schema.sql (db:reset drops tables first).

insert into products (slug, name, price, currency, description, drop_name, season, is_new, is_published) values
  ('black-runway-url-tee',     'BLACK RUNWAY URL TEE',      50,  'GBP', 'Black heavyweight tee, boxy fit, runway URL graphic across the chest.',                'Drop 001', 'SS26', true,  true),
  ('white-runway-url-tee',     'WHITE RUNWAY URL TEE',      50,  'GBP', 'White heavyweight tee, boxy fit, runway URL graphic across the chest.',                'Drop 001', 'SS26', true,  true),
  ('black-swag-is-art-shorts', 'BLACK SWAG IS ART SHORTS',  65,  'GBP', 'Black relaxed-fit shorts with a tonal SWAG IS ART repeat in the waistband.',            'Drop 001', 'SS26', true,  true),
  ('swag-is-art-hoodie-scarf', 'SWAG IS ART HOODIE SCARF',  45,  'GBP', 'A hoodie-detailed scarf — one statement piece with the archive wordmark woven through.', 'Drop 001', 'SS26', true,  true),
  ('almost-gaf',               'ALMOST GAF',                120, 'GBP', 'Cut-and-sew layering piece with an offset side seam and dropped panels.',                'Drop 001', 'SS26', false, true),
  ('crt-domain-expansion',     'CRT DOMAIN EXPANSION',      110, 'GBP', 'CRT-flare graphic piece, domain-expansion print across the back, oversized cut.',        'Drop 001', 'SS26', false, true);

-- Primary images (position 0 = card image). More angles can be added later.
insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_runaway_dex53r.png', 0
from products where slug = 'black-runway-url-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858892/white_runaway_dzqndl.png', 0
from products where slug = 'white-runway-url-tee';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_Swag_Short_ahw3ao.png', 0
from products where slug = 'black-swag-is-art-shorts';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/SWAG_IS_ART_-_hoodie_i6xezo.png', 0
from products where slug = 'swag-is-art-hoodie-scarf';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858882/almost_gaf_xoexrf.png', 0
from products where slug = 'almost-gaf';

insert into product_images (product_id, url, position)
select id, 'https://res.cloudinary.com/dicxujpqy/image/upload/v1787858885/crt_domain_eqhsue.png', 0
from products where slug = 'crt-domain-expansion';

-- Variants (size/stock). CRT DOMAIN EXPANSION is sold out (all zero stock).
insert into product_variants (product_id, size, stock)
select id, s.size, s.stock
from products
cross join (values
  ('S', 8), ('M', 10), ('L', 6), ('XL', 3)
) as s(size, stock)
where slug in ('black-runway-url-tee', 'white-runway-url-tee', 'black-swag-is-art-shorts');

insert into product_variants (product_id, size, stock)
select id, 'OS', 12
from products where slug = 'swag-is-art-hoodie-scarf';

insert into product_variants (product_id, size, stock)
select id, s.size, s.stock
from products
cross join (values
  ('S', 4), ('M', 5), ('L', 4), ('XL', 2)
) as s(size, stock)
where slug = 'almost-gaf';

insert into product_variants (product_id, size, stock)
select id, s.size, 0
from products
cross join (values ('S'), ('M'), ('L'), ('XL')) as s(size)
where slug = 'crt-domain-expansion';