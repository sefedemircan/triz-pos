-- ADIM 4: RLS Politikalarını Düzeltme
-- Bu script RLS politikalarını daha esnek hale getirir

-- Önce mevcut politikaları sil
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Anyone can read tables" ON tables;
DROP POLICY IF EXISTS "Admin and waiters can update tables" ON tables;
DROP POLICY IF EXISTS "Admin can insert tables" ON tables;
DROP POLICY IF EXISTS "Admin can delete tables" ON tables;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Admin can manage products" ON products;

-- Yeni, daha esnek politikalar

-- Users tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON users 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- Tables tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON tables 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON tables 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON tables 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON tables 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Categories tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON categories 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON categories 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON categories 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON categories 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Products tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON products 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON products 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON products 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON products 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Orders tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON orders 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON orders 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON orders 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON orders 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Order Items tablosu politikaları
CREATE POLICY "Enable read access for authenticated users" ON order_items 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON order_items 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON order_items 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON order_items 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Kontrol: Yeni politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 