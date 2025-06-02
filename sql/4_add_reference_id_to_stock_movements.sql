-- Stock movements tablosuna reference_id alanı ekle
-- Bu alan sipariş numarası, transfer ID'si vb. referansları tutar

ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference 
ON stock_movements(reference_type, reference_id);

-- Yorum ekle
COMMENT ON COLUMN stock_movements.reference_id IS 'Hareketin referans aldığı kaydın ID''si (sipariş no, transfer ID vb.)';

-- Veri kontrolü için bir view oluştur
CREATE OR REPLACE VIEW stock_movements_with_references AS
SELECT 
  sm.*,
  CASE 
    WHEN sm.reference_type = 'order' THEN 
      CASE WHEN sm.reference_id IS NOT NULL THEN 'Sipariş: ' || sm.reference_id ELSE 'Sipariş' END
    WHEN sm.reference_type = 'purchase' THEN 
      CASE WHEN sm.reference_id IS NOT NULL THEN 'Satın Alma: ' || sm.reference_id ELSE 'Satın Alma' END
    WHEN sm.reference_type = 'transfer' THEN 
      CASE WHEN sm.reference_id IS NOT NULL THEN 'Transfer: ' || sm.reference_id ELSE 'Transfer' END
    WHEN sm.reference_type = 'manual' THEN 'Manuel İşlem'
    WHEN sm.reference_type = 'order_cancel' THEN 
      CASE WHEN sm.reference_id IS NOT NULL THEN 'Sipariş İptal: ' || sm.reference_id ELSE 'Sipariş İptal' END
    ELSE 
      CASE WHEN sm.reference_type IS NOT NULL THEN 'Diğer: ' || sm.reference_type ELSE 'Diğer' END
  END as reference_display
FROM stock_movements sm; 