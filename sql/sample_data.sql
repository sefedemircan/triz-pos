-- Örnek test verileri
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Önce mevcut test verilerini temizle (opsiyonel)
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM products;
-- DELETE FROM categories;
-- DELETE FROM tables WHERE table_number > 10;

-- Kategoriler ekle
INSERT INTO public.categories (name, description, color, display_order, is_active) VALUES
('Sıcak İçecekler', 'Kahve, çay ve sıcak içecekler', 'brown', 1, true),
('Soğuk İçecekler', 'Soğuk kahve, meyve suları ve gazlı içecekler', 'blue', 2, true),
('Tatlılar', 'Pasta, kurabiye ve tatlılar', 'pink', 3, true),
('Atıştırmalıklar', 'Sandviç, tost ve hafif yemekler', 'orange', 4, true),
('Kahvaltı', 'Kahvaltı menüleri', 'green', 5, true);

-- Ürünler ekle (bazılarına fotoğraf URL'si ile)
INSERT INTO public.products (name, description, price, category_id, is_available, image_url) 
SELECT 
  p.name,
  p.description,
  p.price,
  c.id,
  p.is_available,
  p.image_url
FROM (VALUES
  -- Sıcak İçecekler
  ('Türk Kahvesi', 'Geleneksel Türk kahvesi, şekerli/şekersiz', 25.00, 'Sıcak İçecekler', true, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop'),
  ('Espresso', 'İtalyan usulü espresso', 20.00, 'Sıcak İçecekler', true, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop'),
  ('Cappuccino', 'Espresso üzerine süt köpüğü', 30.00, 'Sıcak İçecekler', true, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop'),
  ('Latte', 'Espresso ve süt karışımı', 32.00, 'Sıcak İçecekler', true, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&h=200&fit=crop'),
  ('Çay', 'Türk çayı, bardak', 15.00, 'Sıcak İçecekler', true, NULL),
  ('Bitki Çayı', 'Papatya, nane, adaçayı seçenekleri', 18.00, 'Sıcak İçecekler', true, NULL),
  
  -- Soğuk İçecekler
  ('Iced Coffee', 'Buzlu kahve', 28.00, 'Soğuk İçecekler', true, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&h=200&fit=crop'),
  ('Frappuccino', 'Buzlu kahve karışımı', 35.00, 'Soğuk İçecekler', true, 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=300&h=200&fit=crop'),
  ('Limonata', 'Taze sıkılmış limonata', 22.00, 'Soğuk İçecekler', true, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&h=200&fit=crop'),
  ('Portakal Suyu', 'Taze sıkılmış portakal suyu', 25.00, 'Soğuk İçecekler', true, NULL),
  ('Kola', 'Coca Cola, Pepsi', 18.00, 'Soğuk İçecekler', true, NULL),
  ('Su', 'İçme suyu 500ml', 8.00, 'Soğuk İçecekler', true, NULL),
  
  -- Tatlılar
  ('Cheesecake', 'New York usulü cheesecake', 45.00, 'Tatlılar', true, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&h=200&fit=crop'),
  ('Tiramisu', 'İtalyan tatlısı tiramisu', 42.00, 'Tatlılar', true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop'),
  ('Brownie', 'Çikolatalı brownie', 35.00, 'Tatlılar', true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=200&fit=crop'),
  ('Muffin', 'Çikolatalı veya meyveli muffin', 28.00, 'Tatlılar', true, NULL),
  ('Kurabiye', 'Ev yapımı kurabiye çeşitleri', 20.00, 'Tatlılar', true, NULL),
  
  -- Atıştırmalıklar
  ('Club Sandwich', 'Tavuk, marul, domates, mayonez', 55.00, 'Atıştırmalıklar', true, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop'),
  ('Tost', 'Kaşar peynirli tost', 35.00, 'Atıştırmalıklar', true, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop'),
  ('Kruvasan', 'Tereyağlı kruvasan', 25.00, 'Atıştırmalıklar', true, NULL),
  ('Bagel', 'Somon ve krem peynirli bagel', 48.00, 'Atıştırmalıklar', true, NULL),
  ('Salata', 'Mevsim salata çeşitleri', 40.00, 'Atıştırmalıklar', true, NULL),
  
  -- Kahvaltı
  ('Serpme Kahvaltı', 'Geleneksel Türk kahvaltısı', 85.00, 'Kahvaltı', true, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop'),
  ('Omlet', 'Peynirli, mantarlı veya sebzeli omlet', 45.00, 'Kahvaltı', true, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&h=200&fit=crop'),
  ('Pancake', 'Amerikan usulü pancake', 38.00, 'Kahvaltı', true, NULL),
  ('Waffle', 'Belçika usulü waffle', 42.00, 'Kahvaltı', true, NULL),
  ('Menemen', 'Geleneksel menemen', 35.00, 'Kahvaltı', true, NULL)
) AS p(name, description, price, category_name, is_available, image_url)
JOIN public.categories c ON c.name = p.category_name;

-- Masalar ekle (table_number unique olduğu için ON CONFLICT kullanabiliriz)
INSERT INTO public.tables (table_number, capacity, status) 
SELECT 
  generate_series(1, 15) as table_number,
  CASE 
    WHEN generate_series(1, 15) <= 8 THEN 4
    WHEN generate_series(1, 15) <= 12 THEN 6
    ELSE 8
  END as capacity,
  'empty' as status
ON CONFLICT (table_number) DO NOTHING;

-- Kontrol sorguları
SELECT 'Kategoriler' as tablo, count(*) as adet FROM categories
UNION ALL
SELECT 'Ürünler' as tablo, count(*) as adet FROM products
UNION ALL
SELECT 'Masalar' as tablo, count(*) as adet FROM tables
ORDER BY tablo; 