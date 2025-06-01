-- ADIM 5: Mevcut durumu kontrol et

-- 1. Auth tablosundaki kullanıcıları kontrol et
SELECT 
    'Auth Users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Public users tablosundaki kullanıcıları kontrol et
SELECT 
    'Public Users:' as info,
    id,
    email,
    role,
    full_name,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Orphan auth users (public.users'da olmayan auth kullanıcıları)
SELECT 
    'Orphan Auth Users:' as info,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC; 