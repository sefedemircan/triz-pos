# Cafe POS - Adisyon Sistemi

Modern bir kafe işletmesi için geliştirilmiş Next.js tabanlı adisyon yönetim sistemi.

## 🚀 Teknolojiler

- **Frontend**: Next.js 15 (App Router)
- **UI Framework**: Mantine UI
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Zustand
- **Styling**: Mantine CSS
- **Icons**: Tabler Icons
- **Language**: TypeScript

## ✨ Özellikler

### MVP Kapsamı

- ✅ **Kullanıcı Yetkilendirme**
  - Email/şifre ile giriş
  - Rol bazlı erişim (admin, garson, mutfak)
  - Güvenli oturum yönetimi

- ✅ **Masa Yönetimi**
  - Masa oluşturma, düzenleme, silme
  - Masa durumu takibi (boş/dolu/rezerve)
  - Kapasite yönetimi

- 🔄 **Ürün ve Menü Yönetimi** (Geliştiriliyor)
  - Kategorilere ayrılmış ürünler
  - Fiyat ve stok yönetimi
  - Ürün düzenleme

- 🔄 **Sipariş (Adisyon) Yönetimi** (Geliştiriliyor)
  - Yeni sipariş oluşturma
  - Sepet yönetimi
  - Sipariş durumu takibi

- 🔄 **Mutfak Paneli** (Geliştiriliyor)
  - Gerçek zamanlı sipariş takibi
  - Sipariş durumu güncelleme
  - Hazırlık süreci yönetimi

- 🔄 **Ödeme ve Adisyon Kapatma** (Geliştiriliyor)
  - Ödeme alma
  - Adisyon kapatma
  - Temel raporlama

## 🛠️ Kurulum

### Ön Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı

### 1. Projeyi Klonlayın

```bash
git clone <repo-url>
cd cafe-pos
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Dosyasını Oluşturun

.env.local dosyasını oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Veritabanını Kurun

Supabase dashboard'unuzda aşağıdaki tabloları oluşturun:

#### Users Tablosu
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'garson', 'mutfak')),
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tables Tablosu
```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'reserved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Categories Tablosu
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Products Tablosu
```sql
CREATE TABLE products (
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
```

#### Orders Tablosu
```sql
CREATE TABLE orders (
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
```

#### Order Items Tablosu
```sql
CREATE TABLE order_items (
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
```

### 5. RLS (Row Level Security) Politikalarını Ayarlayın

Her tablo için uygun RLS politikalarını Supabase dashboard'undan ekleyin.

### 6. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router sayfaları
│   ├── dashboard/         # Dashboard sayfaları
│   ├── login/             # Giriş sayfası
│   └── layout.tsx         # Ana layout
├── components/            # React bileşenleri
│   ├── layout/           # Layout bileşenleri
│   └── providers/        # Context providers
├── lib/                  # Utility fonksiyonlar
│   ├── supabase/        # Supabase client konfigürasyonu
│   └── types/           # TypeScript tip tanımları
└── store/               # Zustand state management
```

## 🔐 Kullanıcı Rolleri

- **Admin**: Tüm sistem yönetimi, raporlar, personel yönetimi
- **Garson**: Sipariş alma, masa yönetimi, ödeme işlemleri
- **Mutfak**: Sipariş görüntüleme, hazırlık durumu güncelleme

## 🚧 Geliştirme Durumu

- [x] Temel authentication sistemi
- [x] Masa yönetimi
- [x] Dashboard ve navigasyon
- [ ] Ürün ve kategori yönetimi
- [ ] Sipariş sistemi
- [ ] Mutfak paneli
- [ ] Ödeme ve adisyon kapatma
- [ ] Gerçek zamanlı güncellemeler
- [ ] Raporlama sistemi
- [ ] Mobil responsive tasarım iyileştirmeleri

## 🤝 Katkıda Bulunma

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue oluşturabilir veya doğrudan iletişime geçebilirsiniz.
