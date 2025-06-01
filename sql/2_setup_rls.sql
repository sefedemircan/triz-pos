-- ADIM 2: RLS (Row Level Security) ayarları ve politikalar
-- Bu script'i 1_create_tables.sql'den sonra çalıştırın

-- RLS'yi etkinleştir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users tablosu politikaları
-- Kullanıcılar kendi verilerini okuyabilir
CREATE POLICY "Users can read own data" ON users 
    FOR SELECT USING (auth.uid() = id);

-- Yeni kullanıcılar kendilerini kaydedebilir (sign up için)
CREATE POLICY "Users can insert own data" ON users 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi verilerini güncelleyebilir
CREATE POLICY "Users can update own data" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- Admin kullanıcıları tüm kullanıcıları görebilir
CREATE POLICY "Admin can read all users" ON users 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tables tablosu politikaları
-- Tüm giriş yapmış kullanıcılar masaları görebilir
CREATE POLICY "Anyone can read tables" ON tables 
    FOR SELECT TO authenticated USING (true);

-- Admin ve garson masaları güncelleyebilir
CREATE POLICY "Admin and waiters can update tables" ON tables 
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'garson')
        )
    );

-- Admin masaları ekleyebilir ve silebilir
CREATE POLICY "Admin can insert tables" ON tables 
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete tables" ON tables 
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Categories tablosu politikaları
CREATE POLICY "Anyone can read categories" ON categories 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage categories" ON categories 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products tablosu politikaları
CREATE POLICY "Anyone can read products" ON products 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage products" ON products 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders tablosu politikaları
CREATE POLICY "Users can read related orders" ON orders 
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'mutfak')
        )
    );

CREATE POLICY "Waiters and admin can create orders" ON orders 
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'garson')
        )
    );

CREATE POLICY "Users can update related orders" ON orders 
    FOR UPDATE TO authenticated USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'mutfak')
        )
    );

-- Order Items tablosu politikaları
CREATE POLICY "Users can read related order items" ON order_items 
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id AND (
                user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role IN ('admin', 'mutfak')
                )
            )
        )
    );

CREATE POLICY "Users can manage related order items" ON order_items 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id AND (
                user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role IN ('admin', 'mutfak')
                )
            )
        )
    );

-- Trigger fonksiyonu: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları ekle
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at 
    BEFORE UPDATE ON tables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kontrol: Politikaların oluşturulup oluşturulmadığını kontrol edin
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 