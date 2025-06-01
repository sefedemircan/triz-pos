-- Mevcut ürünlerdeki görsel URL'lerini temizle
-- Supabase Dashboard > SQL Editor'da çalıştırın

UPDATE public.products 
SET image_url = NULL 
WHERE image_url IS NOT NULL;

-- Kontrol sorgusu
SELECT 
  name,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'Görsel yok'
    ELSE 'Görsel var'
  END as gorsel_durumu
FROM public.products 
ORDER BY name; 