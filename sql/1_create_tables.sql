-- ADIM 1: Tabloları oluşturun (Bu script'i önce çalıştırın)
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Users tablosu
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'garson', 'mutfak')),
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tables tablosu
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'reserved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories tablosu (gelecekte kullanım için)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    color VARCHAR DEFAULT 'blue',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Products tablosu (gelecekte kullanım için)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders tablosu (gelecekte kullanım için)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES tables(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR DEFAULT 'pending' CHECK (payment_method IN ('cash', 'card', 'pending')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Order Items tablosu (gelecekte kullanım için)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kontrol: Tabloların oluşturulup oluşturulmadığını kontrol edin
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'tables', 'categories', 'products', 'orders', 'order_items')
ORDER BY table_name; 