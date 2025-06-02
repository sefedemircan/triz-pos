-- Stok Yönetimi Sistemi - Veritabanı Tabloları
-- Bu script stok yönetimi için gerekli tabloları oluşturur

-- 1. Stok Kategorileri Tablosu
CREATE TABLE IF NOT EXISTS public.stock_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
    icon VARCHAR(50) DEFAULT 'IconBox', -- Tabler icon name
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stok Kalemleri Tablosu
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES stock_categories(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL, -- kg, litre, adet, gram, ml vb.
    min_stock_level DECIMAL(10,3) DEFAULT 0,
    max_stock_level DECIMAL(10,3) DEFAULT 0,
    current_stock DECIMAL(10,3) DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    supplier VARCHAR(200),
    barcode VARCHAR(100),
    expiry_date DATE,
    location VARCHAR(100), -- Depo konumu
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stok Hareketleri Tablosu
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'expired', 'waste')),
    quantity DECIMAL(10,3) NOT NULL,
    previous_stock DECIMAL(10,3) NOT NULL,
    new_stock DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_type VARCHAR(50), -- 'purchase', 'usage', 'waste', 'manual', 'order'
    reference_id UUID, -- İlgili belge/sipariş ID'si
    user_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ürün Reçeteleri Tablosu (Ürün-Stok İlişkisi)
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10,3) NOT NULL, -- Bir porsiyon için gerekli miktar
    unit VARCHAR(20) NOT NULL, -- Birim (stock_items.unit ile uyumlu olmalı)
    is_critical BOOLEAN DEFAULT false, -- Bu malzeme kritik mi?
    cost_percentage DECIMAL(5,2) DEFAULT 0, -- Bu malzemenin ürün maliyetindeki payı
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, stock_item_id) -- Bir üründe aynı stok kalemi birden fazla olamaz
);

-- 5. Stok Uyarıları Tablosu
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon', 'expired')),
    threshold_value DECIMAL(10,3), -- Uyarı tetiklenen değer
    current_value DECIMAL(10,3), -- Mevcut değer
    message TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_active ON stock_items(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_items_current_stock ON stock_items(current_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_item ON stock_alerts(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON stock_alerts(is_resolved) WHERE is_resolved = false;

-- Trigger: Stok hareketi sonrası current_stock güncelleme
CREATE OR REPLACE FUNCTION update_current_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stock_items 
    SET current_stock = NEW.new_stock,
        updated_at = NOW()
    WHERE id = NEW.stock_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_current_stock
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_current_stock();

-- Trigger: Stok seviyesi kontrolü ve uyarı oluşturma
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Düşük stok uyarısı
    IF NEW.current_stock <= (SELECT min_stock_level FROM stock_items WHERE id = NEW.stock_item_id) THEN
        INSERT INTO stock_alerts (stock_item_id, alert_type, threshold_value, current_value, message)
        VALUES (
            NEW.stock_item_id, 
            CASE WHEN NEW.current_stock <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
            (SELECT min_stock_level FROM stock_items WHERE id = NEW.stock_item_id),
            NEW.current_stock,
            CASE 
                WHEN NEW.current_stock <= 0 THEN 'Stok tükendi!'
                ELSE 'Stok minimum seviyenin altında!'
            END
        )
        ON CONFLICT (stock_item_id, alert_type) 
        WHERE is_resolved = false
        DO UPDATE SET 
            current_value = NEW.current_stock,
            created_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_stock_levels
    AFTER UPDATE OF current_stock ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_levels();

-- Örnek veri ekleme
INSERT INTO stock_categories (name, description, color, icon) VALUES
('Gıda Malzemeleri', 'Temel gıda maddeleri ve malzemeler', '#ef4444', 'IconChefHat'),
('İçecek Malzemeleri', 'Kahve, çay ve diğer içecek malzemeleri', '#3b82f6', 'IconCup'),
('Temizlik Malzemeleri', 'Temizlik ve hijyen ürünleri', '#10b981', 'IconSpray'),
('Kağıt/Ambalaj', 'Servis malzemeleri ve ambalaj ürünleri', '#f59e0b', 'IconPackage'),
('Ekipman/Donanım', 'Mutfak ekipmanları ve yedek parçalar', '#8b5cf6', 'IconTool')
ON CONFLICT (name) DO NOTHING;

-- Örnek stok kalemleri
INSERT INTO stock_items (name, category_id, unit, min_stock_level, max_stock_level, current_stock, unit_cost, supplier) VALUES
('Süt', (SELECT id FROM stock_categories WHERE name = 'Gıda Malzemeleri'), 'litre', 5, 50, 25, 3.50, 'Süt Kooperatifi'),
('Kahve Çekirdeği', (SELECT id FROM stock_categories WHERE name = 'İçecek Malzemeleri'), 'kg', 3, 30, 15, 45.00, 'Kahve Dünyası'),
('Şeker', (SELECT id FROM stock_categories WHERE name = 'Gıda Malzemeleri'), 'kg', 2, 20, 8, 5.25, 'Şeker Fabrikası'),
('Kağıt Bardak (12oz)', (SELECT id FROM stock_categories WHERE name = 'Kağıt/Ambalaj'), 'adet', 100, 1000, 500, 0.15, 'Ambalaj Ltd.'),
('Peçete', (SELECT id FROM stock_categories WHERE name = 'Kağıt/Ambalaj'), 'paket', 10, 100, 45, 2.75, 'Kağıt Evi'),
('Bulaşık Deterjanı', (SELECT id FROM stock_categories WHERE name = 'Temizlik Malzemeleri'), 'litre', 2, 20, 8, 12.50, 'Temizlik AŞ')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE stock_categories IS 'Stok kategorilerini saklar (Gıda, İçecek, Temizlik vb.)';
COMMENT ON TABLE stock_items IS 'Stok kalemlerini ve mevcut durumlarını saklar';
COMMENT ON TABLE stock_movements IS 'Tüm stok giriş/çıkış hareketlerini saklar';
COMMENT ON TABLE product_recipes IS 'Menü ürünleri için gerekli malzemeleri ve miktarları saklar';
COMMENT ON TABLE stock_alerts IS 'Stok uyarıları ve bildirimlerini saklar'; 