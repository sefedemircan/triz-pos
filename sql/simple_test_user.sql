-- Basit test kullanıcısı oluşturma
-- Bu script'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Önce auth.users'a manuel ID ile kullanıcı ekleyelim
-- Not: Bu yöntem daha basittir ve test için uygundur

-- 1. Admin kullanıcısı (email: admin@test.com, şifre: 123456)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- 2. public.users tablosuna admin bilgilerini ekle
INSERT INTO public.users (id, email, role, full_name) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'admin', 'Test Admin');

-- 3. Garson kullanıcısı (email: garson@test.com, şifre: 123456)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'garson@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- 4. public.users tablosuna garson bilgilerini ekle
INSERT INTO public.users (id, email, role, full_name) VALUES
('22222222-2222-2222-2222-222222222222', 'garson@test.com', 'garson', 'Test Garson');

-- 5. Test masaları ekle (eğer henüz yoksa)
INSERT INTO public.tables (table_number, capacity, status) VALUES
(1, 4, 'empty'),
(2, 2, 'empty'),
(3, 6, 'empty'),
(4, 4, 'occupied'),
(5, 2, 'reserved')
ON CONFLICT (table_number) DO NOTHING;

-- Kontrol için
SELECT 'Auth kullanıcıları:' as info;
SELECT email, created_at FROM auth.users WHERE email LIKE '%@test.com';

SELECT 'Public kullanıcıları:' as info;
SELECT email, role, full_name FROM public.users;

SELECT 'Masalar:' as info;
SELECT table_number, capacity, status FROM public.tables ORDER BY table_number; 