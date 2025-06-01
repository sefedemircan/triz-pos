-- Mevcut ürünlere fotoğraf URL'si ekleme scripti
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Sıcak İçecekler
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop' 
WHERE name = 'Türk Kahvesi' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop' 
WHERE name = 'Espresso' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop' 
WHERE name = 'Cappuccino' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&h=200&fit=crop' 
WHERE name = 'Latte' AND image_url IS NULL;

-- Soğuk İçecekler
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&h=200&fit=crop' 
WHERE name = 'Iced Coffee' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=300&h=200&fit=crop' 
WHERE name = 'Frappuccino' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&h=200&fit=crop' 
WHERE name = 'Limonata' AND image_url IS NULL;

-- Tatlılar
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&h=200&fit=crop' 
WHERE name = 'Cheesecake' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop' 
WHERE name = 'Tiramisu' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=200&fit=crop' 
WHERE name = 'Brownie' AND image_url IS NULL;

-- Atıştırmalıklar
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop' 
WHERE name = 'Club Sandwich' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop' 
WHERE name = 'Tost' AND image_url IS NULL;

-- Kahvaltı
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop' 
WHERE name = 'Serpme Kahvaltı' AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&h=200&fit=crop' 
WHERE name = 'Omlet' AND image_url IS NULL;

-- Kontrol sorgusu - kaç ürünün fotoğrafı var
SELECT 
  COUNT(*) as toplam_urun,
  COUNT(image_url) as fotografli_urun,
  COUNT(*) - COUNT(image_url) as fotografsiz_urun
FROM products; 