# Test Kullanıcısı Kurulum Rehberi

## Adım 1: Supabase Proje Kurulumu

1. [Supabase](https://supabase.com) hesabınıza giriş yapın
2. Yeni bir proje oluşturun
3. Proje dashboard'ında **Settings > API** bölümünden:
   - `Project URL` ve `anon public` key'ini kopyalayın
   - Bu bilgileri `.env.local` dosyasına ekleyin

## Adım 2: Environment Dosyası Oluşturma

Proje ana dizininde `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Adım 3: Veritabanı Kurulumu

⚠️ **Önemli: SQL script'lerini sırayla çalıştırın!**

### 3.1. Tabloları Oluşturun
Supabase Dashboard'da **SQL Editor** bölümünde `sql/1_create_tables.sql` dosyasının içeriğini çalıştırın.

### 3.2. RLS Politikalarını Ayarlayın
`sql/2_setup_rls.sql` dosyasının içeriğini çalıştırın.

### 3.3. Test Kullanıcılarını Ekleyin (İsteğe Bağlı)
`sql/simple_test_user.sql` dosyasının içeriğini çalıştırın.

## Adım 4: Email Ayarları (Sign Up İçin)

Supabase Dashboard'da **Authentication > Settings** bölümünde:

1. **Site URL**: `http://localhost:3000` ekleyin
2. **Redirect URLs**: `http://localhost:3000/auth/callback` ekleyin
3. **Email Templates** bölümünden konfirmasyon emailini özelleştirin (isteğe bağlı)

## Adım 5: Projeyi Çalıştırma

```bash
npm install
npm run dev
```

## Kullanım

### Yeni Hesap Oluşturma (Sign Up)
1. `http://localhost:3000/login` adresine gidin
2. **"Hesap Oluştur"** tabına tıklayın
3. Formu doldurun:
   - Ad Soyad
   - Email adresi
   - Rol seçimi (Admin/Garson/Mutfak)
   - Şifre (en az 6 karakter)
4. **"Hesap Oluştur"** butonuna tıklayın
5. Email adresinize gelen doğrulama linkine tıklayın
6. Giriş yapabilirsiniz

### Mevcut Hesapla Giriş
1. **"Giriş Yap"** tabında email ve şifrenizi girin
2. Veya demo butonlarını kullanın

## Test Hesapları

Hızlı test için hazır hesaplar:

| Rol    | Email           | Şifre  |
|--------|-----------------|--------|
| Admin  | admin@test.com  | 123456 |
| Garson | garson@test.com | 123456 |

## Roller ve Yetkiler

### Admin
- Tüm sistem yönetimi
- Kullanıcı yönetimi
- Masa, ürün, kategori yönetimi
- Tüm raporları görme

### Garson
- Sipariş alma ve oluşturma
- Masa durumları güncelleme
- Kendi siparişlerini görme
- Ödeme işlemleri

### Mutfak
- Sipariş görüntüleme
- Sipariş durumu güncelleme
- Hazırlık süreçlerini takip etme

## Güvenlik Ayarları

Sistem Row Level Security (RLS) kullanır:
- Kullanıcılar sadece kendi verilerini görebilir
- Admin tüm verilere erişebilir
- Roller bazında yetki kontrolü
- Otomatik güncelleme zamanı takibi

## Sorun Giderme

### Giriş Yapamıyorum
1. Email doğrulamasını yaptığınızdan emin olun
2. Supabase project URL ve key'lerin doğru olduğunu kontrol edin
3. Browser developer tools'da console hatalarını kontrol edin

### Sign Up Çalışmıyor
1. Email ayarlarının doğru yapıldığını kontrol edin
2. Site URL'nin localhost:3000 olarak ayarlandığını kontrol edin
3. RLS politikalarının çalıştırıldığını kontrol edin

### Masalar Görünmüyor
1. RLS politikalarının doğru ayarlandığını kontrol edin
2. Kullanıcının users tablosunda kayıtlı olduğunu kontrol edin
3. Test verilerinin eklendiğini kontrol edin

### Email Doğrulama Gelmiyor
1. Spam klasörünü kontrol edin
2. Supabase Auth ayarlarını kontrol edin
3. SMTP ayarlarını (production için) kontrol edin

## Veritabanı Yapısı

```
users (Kullanıcılar)
├── id (UUID, Primary Key)
├── email (VARCHAR, Unique)
├── role (admin/garson/mutfak)
├── full_name (VARCHAR)
└── timestamps

tables (Masalar)
├── id (UUID, Primary Key)
├── table_number (INTEGER, Unique)
├── capacity (INTEGER)
├── status (empty/occupied/reserved)
└── timestamps

categories (Kategoriler)
├── id (UUID, Primary Key)
├── name (VARCHAR)
├── description (TEXT)
├── display_order (INTEGER)
├── is_active (BOOLEAN)
└── timestamps

products (Ürünler)
├── id (UUID, Primary Key)
├── name (VARCHAR)
├── description (TEXT)
├── price (DECIMAL)
├── category_id (UUID, FK)
├── is_available (BOOLEAN)
├── image_url (TEXT)
└── timestamps

orders (Siparişler)
├── id (UUID, Primary Key)
├── table_id (UUID, FK)
├── user_id (UUID, FK)
├── status (active/completed/cancelled)
├── total_amount (DECIMAL)
├── payment_method (cash/card/pending)
├── notes (TEXT)
└── timestamps

order_items (Sipariş Öğeleri)
├── id (UUID, Primary Key)
├── order_id (UUID, FK)
├── product_id (UUID, FK)
├── quantity (INTEGER)
├── unit_price (DECIMAL)
├── total_price (DECIMAL)
├── status (pending/preparing/ready/served)
├── notes (TEXT)
└── timestamps
``` 