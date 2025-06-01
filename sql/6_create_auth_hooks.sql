-- ADIM 6: Auth Hooks ve Triggers Oluşturma

-- Function: Yeni kullanıcı kaydında otomatik public.users kaydı oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    'garson', -- Default role (admin ayrıca ayarlanabilir)
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auth.users'a yeni kayıt eklendiğinde handle_new_user fonksiyonunu çalıştır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Mevcut orphan auth users'ları public.users'a ekle
INSERT INTO public.users (id, email, role, full_name)
SELECT 
    au.id,
    au.email,
    'garson' as role, -- Default role
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Admin kullanıcılarını güncelle (gerekirse)
UPDATE public.users 
SET role = 'admin' 
WHERE email IN ('admin@test.com', 'admin@example.com'); 