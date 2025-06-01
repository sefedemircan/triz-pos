-- Categories tablosuna color kolonu ekle
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Color kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'color'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.categories 
        ADD COLUMN color VARCHAR DEFAULT 'blue';
        
        -- Mevcut kategorilere default renkler ata
        UPDATE public.categories 
        SET color = CASE 
            WHEN name ILIKE '%kahve%' OR name ILIKE '%coffee%' THEN 'brown'
            WHEN name ILIKE '%çay%' OR name ILIKE '%tea%' THEN 'green'
            WHEN name ILIKE '%tatlı%' OR name ILIKE '%dessert%' THEN 'pink'
            WHEN name ILIKE '%yemek%' OR name ILIKE '%food%' THEN 'orange'
            WHEN name ILIKE '%içecek%' OR name ILIKE '%drink%' THEN 'blue'
            ELSE 'blue'
        END
        WHERE color IS NULL;
        
        RAISE NOTICE 'Color column added to categories table successfully';
    ELSE
        RAISE NOTICE 'Color column already exists in categories table';
    END IF;
END $$; 