-- Güvenli veri ekleme scripti
-- Önce mevcut test verilerini temizler, sonra yeni verileri ekler
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Mevcut test verilerini temizle
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.categories;
DELETE FROM public.tables WHERE table_number > 0;

-- Kategoriler ekle
INSERT INTO public.categories (name, description, color, display_order, is_active) VALUES
('Sıcak İçecekler', 'Kahve, çay ve sıcak içecekler', 'brown', 1, true),
('Soğuk İçecekler', 'Soğuk kahve, meyve suları ve gazlı içecekler', 'blue', 2, true),
('Tatlılar', 'Pasta, kurabiye ve tatlılar', 'pink', 3, true),
('Atıştırmalıklar', 'Sandviç, tost ve hafif yemekler', 'orange', 4, true),
('Kahvaltı', 'Kahvaltı menüleri', 'green', 5, true);

-- Ürünler ekle (görsel olmadan)
INSERT INTO public.products (name, description, price, category_id, is_available) 
SELECT 
  p.name,
  p.description,
  p.price,
  c.id,
  p.is_available
FROM (VALUES
  -- Sıcak İçecekler
  ('Türk Kahvesi', 'Geleneksel Türk kahvesi, şekerli/şekersiz', 25.00, 'Sıcak İçecekler', true),
  ('Espresso', 'İtalyan usulü espresso', 20.00, 'Sıcak İçecekler', true),
  ('Cappuccino', 'Espresso üzerine süt köpüğü', 30.00, 'Sıcak İçecekler', true),
  ('Latte', 'Espresso ve süt karışımı', 32.00, 'Sıcak İçecekler', true),
  ('Çay', 'Türk çayı, bardak', 15.00, 'Sıcak İçecekler', true),
  ('Bitki Çayı', 'Papatya, nane, adaçayı seçenekleri', 18.00, 'Sıcak İçecekler', true),
  
  -- Soğuk İçecekler
  ('Iced Coffee', 'Buzlu kahve', 28.00, 'Soğuk İçecekler', true),
  ('Frappuccino', 'Buzlu kahve karışımı', 35.00, 'Soğuk İçecekler', true),
  ('Limonata', 'Taze sıkılmış limonata', 22.00, 'Soğuk İçecekler', true),
  ('Portakal Suyu', 'Taze sıkılmış portakal suyu', 25.00, 'Soğuk İçecekler', true),
  ('Kola', 'Coca Cola, Pepsi', 18.00, 'Soğuk İçecekler', true),
  ('Su', 'İçme suyu 500ml', 8.00, 'Soğuk İçecekler', true),
  
  -- Tatlılar
  ('Cheesecake', 'New York usulü cheesecake', 45.00, 'Tatlılar', true),
  ('Tiramisu', 'İtalyan tatlısı tiramisu', 42.00, 'Tatlılar', true),
  ('Brownie', 'Çikolatalı brownie', 35.00, 'Tatlılar', true),
  ('Muffin', 'Çikolatalı veya meyveli muffin', 28.00, 'Tatlılar', true),
  ('Kurabiye', 'Ev yapımı kurabiye çeşitleri', 20.00, 'Tatlılar', true),
  
  -- Atıştırmalıklar
  ('Club Sandwich', 'Tavuk, marul, domates, mayonez', 55.00, 'Atıştırmalıklar', true),
  ('Tost', 'Kaşar peynirli tost', 35.00, 'Atıştırmalıklar', true),
  ('Kruvasan', 'Tereyağlı kruvasan', 25.00, 'Atıştırmalıklar', true),
  ('Bagel', 'Somon ve krem peynirli bagel', 48.00, 'Atıştırmalıklar', true),
  ('Salata', 'Mevsim salata çeşitleri', 40.00, 'Atıştırmalıklar', true),
  
  -- Kahvaltı
  ('Serpme Kahvaltı', 'Geleneksel Türk kahvaltısı', 85.00, 'Kahvaltı', true),
  ('Omlet', 'Peynirli, mantarlı veya sebzeli omlet', 45.00, 'Kahvaltı', true),
  ('Pancake', 'Amerikan usulü pancake', 38.00, 'Kahvaltı', true),
  ('Waffle', 'Belçika usulü waffle', 42.00, 'Kahvaltı', true),
  ('Menemen', 'Geleneksel menemen', 35.00, 'Kahvaltı', true)
) AS p(name, description, price, category_name, is_available)
JOIN public.categories c ON c.name = p.category_name;

-- Masalar ekle
INSERT INTO public.tables (table_number, capacity, status) 
SELECT 
  generate_series(1, 15) as table_number,
  CASE 
    WHEN generate_series(1, 15) <= 8 THEN 4
    WHEN generate_series(1, 15) <= 12 THEN 6
    ELSE 8
  END as capacity,
  'empty' as status;

-- Kontrol sorguları
SELECT 'Kategoriler' as tablo, count(*) as adet FROM categories
UNION ALL
SELECT 'Ürünler' as tablo, count(*) as adet FROM products
UNION ALL
SELECT 'Masalar' as tablo, count(*) as adet FROM tables
ORDER BY tablo; 