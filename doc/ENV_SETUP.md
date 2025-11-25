# .env Dosyası Kurulum Rehberi

## Adım 1: Dosyayı Oluşturun

Windows PowerShell'de:
```powershell
Copy-Item .env.example .env
```

Veya manuel olarak:
1. `.env.example` dosyasını kopyalayın
2. `.env` olarak yeniden adlandırın

## Adım 2: Değerleri Doldurun

`.env` dosyasını bir metin editörü ile açın ve aşağıdaki değerleri doldurun:

### Database Configuration (Veritabanı Ayarları)

```env
# Container içi - değiştirmeyin
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ticket_system
```

**Açıklama:**
- `DB_HOST=postgres` - Docker container içinde PostgreSQL servisinin adı (değiştirmeyin)
- `DB_PORT=5432` - Container içi port (değiştirmeyin)
- `DB_NAME=ticket_system` - Veritabanı adı (istediğiniz adı verebilirsiniz)

```env
DB_USER=postgres
DB_PASSWORD=GüçlüŞifre123!
```

**Açıklama:**
- `DB_USER=postgres` - PostgreSQL kullanıcı adı (genellikle `postgres` bırakılır)
- `DB_PASSWORD=GüçlüŞifre123!` - **ÖNEMLİ:** Güçlü bir şifre belirleyin
  - En az 12 karakter
  - Büyük harf, küçük harf, rakam ve özel karakter içermeli
  - Örnek: `MySecurePass2024!`

### Host Port Mapping (Port Ayarları)

```env
POSTGRES_PORT=5433
APP_PORT=8001
```

**Açıklama:**
- `POSTGRES_PORT=5433` - Bilgisayarınızda PostgreSQL'e erişmek için kullanılacak port
  - **Eğer bilgisayarınızda zaten PostgreSQL çalışıyorsa:** Farklı bir port kullanın (örn: 5433, 5434)
  - **Eğer yoksa:** 5432 kullanabilirsiniz
  - Kontrol için: `netstat -an | findstr "5432"`

- `APP_PORT=8001` - Web uygulamasına erişmek için kullanılacak port
  - **Eğer port 8000 kullanılıyorsa:** Farklı bir port kullanın (örn: 8001, 8080)
  - **Eğer yoksa:** 8000 kullanabilirsiniz
  - Kontrol için: `netstat -an | findstr "8000"`

### Application Configuration (Uygulama Ayarları)

```env
SECRET_KEY=çok-gizli-ve-uzun-bir-anahtar-buraya
APP_ENV=development
```

**Açıklama:**
- `SECRET_KEY` - JWT token şifreleme için kullanılan gizli anahtar
  - **Development için:** Şimdilik geçici bir değer kullanabilirsiniz, sonra değiştirebilirsiniz
  - **Production için:** Mutlaka güçlü ve rastgele bir anahtar oluşturun
  - En az 32 karakter olmalı
  - Python ile oluşturma:
    ```python
    import secrets
    print(secrets.token_urlsafe(32))
    ```
  - Veya online generator kullanın: https://randomkeygen.com/
  - **Geçici değer (development):** `change-me-in-production-temporary-key-12345`
  - Örnek (production): `xK9mP2vQ7wR4tY8uI0oP3aS6dF1gH5jK8lZ2x`

- `APP_ENV=development` - Ortam tipi
  - `development` - Geliştirme ortamı
  - `production` - Üretim ortamı

### SMTP Configuration (Email Ayarları - Opsiyonel)

Email bildirimleri için SMTP ayarları:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Açıklama:**
- `SMTP_SERVER` - Email sunucu adresi
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp-mail.outlook.com`
  - Özel sunucu: Sunucu adresiniz

- `SMTP_PORT` - SMTP port numarası
  - Genellikle: `587` (TLS) veya `465` (SSL)

- `SMTP_USER` - Email adresiniz
  - Gmail için: Tam email adresiniz

- `SMTP_PASSWORD` - Email şifreniz
  - **Gmail için:** Uygulama şifresi kullanmanız gerekir
    - Google Hesabınız > Güvenlik > 2 Adımlı Doğrulama > Uygulama şifreleri
  - **Outlook için:** Normal şifre veya uygulama şifresi

- `SMTP_FROM` - Gönderen email adresi
  - Genellikle `SMTP_USER` ile aynı

**Not:** Email özelliğini kullanmayacaksanız, bu değerleri boş bırakabilirsiniz:
```env
SMTP_SERVER=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## Örnek Tam .env Dosyası

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ticket_system
DB_USER=postgres
DB_PASSWORD=MySecurePassword2024!

# Host Port Mapping
POSTGRES_PORT=5433
APP_PORT=8001

# Application Configuration
# Not: Development için geçici değer, production'da mutlaka değiştirin!
SECRET_KEY=change-me-in-production-temporary-key-12345
APP_ENV=development

# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myemail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=noreply@mycompany.com
```

## Güvenlik Kontrol Listesi

- [ ] `DB_PASSWORD` güçlü bir şifre (12+ karakter)
- [ ] `SECRET_KEY` - Development için geçici değer kullanılabilir, production'da mutlaka değiştirilecek
- [ ] `.env` dosyası `.gitignore` içinde (asla commit edilmemeli)
- [ ] Port çakışmaları kontrol edildi
- [ ] Production ortamında farklı değerler kullanılacak

**Not:** Secret key'i sonradan değiştirmek için:
1. `.env` dosyasındaki `SECRET_KEY` değerini değiştirin
2. `docker-compose restart app` komutu ile uygulamayı yeniden başlatın
3. Mevcut kullanıcıların yeniden giriş yapması gerekebilir (token'lar geçersiz olur)

## Port Çakışması Kontrolü

Windows PowerShell'de:

```powershell
# PostgreSQL port kontrolü
netstat -an | findstr "5432"

# Application port kontrolü
netstat -an | findstr "8000"
```

Eğer sonuç varsa, o port kullanılıyor demektir. `.env` dosyasında farklı port kullanın.

## Hızlı Kontrol

Dosyayı kaydettikten sonra:

1. Tüm değerler dolduruldu mu?
2. Şifreler güçlü mü?
3. Port çakışması var mı?
4. `.env` dosyası `.gitignore` içinde mi?

## Sonraki Adım

`.env` dosyasını kaydettikten sonra:

```bash
docker-compose up -d
```

komutu ile servisleri başlatabilirsiniz.

