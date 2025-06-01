-- Test kullanıcıları oluşturma SQL scripti
-- Bu script'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Admin test kullanıcısı
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cafepos.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Users tablosuna admin kullanıcısı ekleme
-- Önce auth.users'dan id'yi alıp users tablosuna ekleyelim
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@cafepos.com'
)
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  auth_user.id,
  'admin@cafepos.com',
  'admin',
  'Test Admin'
FROM auth_user;

-- 3. Garson test kullanıcısı
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'garson@cafepos.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 4. Users tablosuna garson kullanıcısı ekleme
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'garson@cafepos.com'
)
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  auth_user.id,
  'garson@cafepos.com',
  'garson',
  'Test Garson'
FROM auth_user;

-- 5. Mutfak test kullanıcısı
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mutfak@cafepos.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 6. Users tablosuna mutfak kullanıcısı ekleme
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'mutfak@cafepos.com'
)
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  auth_user.id,
  'mutfak@cafepos.com',
  'mutfak',
  'Test Mutfak'
FROM auth_user;

-- 7. Test masalarını da ekleyelim
INSERT INTO public.tables (table_number, capacity, status) VALUES
(1, 4, 'empty'),
(2, 2, 'empty'),
(3, 6, 'empty'),
(4, 4, 'occupied'),
(5, 2, 'empty'),
(6, 8, 'reserved');

-- Test verilerini kontrol etmek için:
-- SELECT * FROM auth.users WHERE email LIKE '%@cafepos.com';
-- SELECT * FROM public.users;
-- SELECT * FROM public.tables; 