-- ADIM 3: Örnek kategoriler ekleme
-- Bu script'i isteğe bağlı olarak çalıştırın

-- Önce mevcut kategorileri temizle (eğer varsa)
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- Örnek kategoriler ekle
INSERT INTO public.categories (name, description, display_order, is_active) VALUES
('İçecekler', 'Sıcak ve soğuk içecek çeşitleri', 1, true),
('Kahve', 'Türk kahvesi, filtre kahve ve espresso çeşitleri', 2, true),
('Çay', 'Çay çeşitleri ve bitki çayları', 3, true),
('Tatlılar', 'Ev yapımı tatlılar ve pasta çeşitleri', 4, true),
('Atıştırmalıklar', 'Hafif atıştırmalık ürünleri', 5, true),
('Ana Yemek', 'Doyurucu ana yemek seçenekleri', 6, true),
('Salatalar', 'Taze salata çeşitleri', 7, true),
('Dondurmalar', 'Mevsimlik dondurma çeşitleri', 8, false);

-- Kontrol için kategori listesini görüntüle
SELECT 
    id,
    name,
    description,
    display_order,
    is_active,
    created_at
FROM public.categories
ORDER BY display_order; 