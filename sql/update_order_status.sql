-- Sipariş durumlarını güncelle
-- Yeni durum: ready (sipariş hazır, ödeme bekliyor)

-- Mevcut 'completed' durumundaki siparişleri 'ready' olarak güncelle (eğer masa hala dolu ise)
UPDATE orders 
SET status = 'ready' 
WHERE status = 'completed' 
AND table_id IN (
  SELECT id FROM tables WHERE status = 'occupied'
);

-- Order status enum'ını güncelle (PostgreSQL için)
-- Bu işlem ALTER TYPE kullanılarak yapılabilir ancak mevcut veriler varken riskli
-- Bunun yerine check constraint kullanabiliriz

-- Mevcut constraint'i kaldır (eğer varsa)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Yeni constraint ekle
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('active', 'ready', 'completed', 'cancelled'));

-- payment_method constraint'ini de güncelle
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('pending', 'cash', 'card'));

COMMENT ON COLUMN orders.status IS 'Order status: active (being prepared), ready (prepared, awaiting payment), completed (paid), cancelled'; 