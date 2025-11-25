# Arayüze Erişim Rehberi

## Arayüz Adresleri

### Development Ortamı (Docker Compose)

Servisleri başlattıktan sonra:

**Ana Arayüz (Frontend):**
```
http://localhost:8000
```

Eğer `.env` dosyasında `APP_PORT` değiştirdiyseniz:
```
http://localhost:8001  (veya belirlediğiniz port)
```

**API Dokümantasyonu (Swagger UI):**
```
http://localhost:8000/docs
```

**ReDoc API Dokümantasyonu:**
```
http://localhost:8000/redoc
```

**Health Check Endpoint:**
```
http://localhost:8000/health
```

## İlk Erişim

1. **Servisleri başlatın:**
   ```bash
   docker-compose up -d
   ```

2. **Servislerin çalıştığını kontrol edin:**
   ```bash
   docker-compose ps
   ```
   
   Her iki servis de "Up" durumunda olmalı:
   - `ticket_postgres` - Up
   - `ticket_app` - Up

3. **Tarayıcıda açın:**
   - Chrome, Edge, Firefox gibi bir tarayıcı açın
   - Adres çubuğuna yazın: `http://localhost:8000`
   - Enter'a basın

## Port Değiştirme

Eğer port 8000 kullanılıyorsa:

1. `.env` dosyasını açın
2. `APP_PORT=8001` (veya başka bir port) yazın
3. Servisleri yeniden başlatın:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
4. Yeni adres: `http://localhost:8001`

## Port Kontrolü

Port'un kullanılıp kullanılmadığını kontrol edin:

**Windows PowerShell:**
```powershell
netstat -an | findstr "8000"
```

Eğer sonuç varsa, port kullanılıyor demektir.

## Sorun Giderme

### "Bu siteye ulaşılamıyor" Hatası

1. **Servislerin çalıştığını kontrol edin:**
   ```bash
   docker-compose ps
   ```

2. **Logları kontrol edin:**
   ```bash
   docker-compose logs app
   ```

3. **Port'un doğru olduğundan emin olun:**
   - `.env` dosyasındaki `APP_PORT` değerini kontrol edin
   - Tarayıcıda doğru port numarasını kullandığınızdan emin olun

### "Connection Refused" Hatası

1. **Container'ın sağlıklı olduğunu kontrol edin:**
   ```bash
   docker-compose ps
   ```

2. **Health check yapın:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Container'ı yeniden başlatın:**
   ```bash
   docker-compose restart app
   ```

### Sayfa Yüklenmiyor

1. **Frontend dosyalarının varlığını kontrol edin:**
   ```bash
   ls app/static/templates/index.html
   ```

2. **Static dosyaların mount edildiğini kontrol edin:**
   - `docker-compose.yml` dosyasında volume mount'ları kontrol edin

## İlk Kullanıcı Oluşturma

Arayüze erişebilmek için önce bir kullanıcı oluşturmanız gerekir:

### Yöntem 1: Veritabanı Üzerinden

```bash
docker-compose exec postgres psql -U postgres -d ticket_system
```

SQL komutları:
```sql
-- Şifre hash'i oluşturmak için Python kullanın:
-- python -c "from app.auth.security import hash_password; print(hash_password('admin123'))"

-- Departman ekle
INSERT INTO departments (name, description) VALUES ('IT', 'IT Departmanı');

-- Rol ekle
INSERT INTO roles (name, description) VALUES ('Admin', 'Yönetici');

-- Kullanıcı ekle (şifre: admin123 - hash'i önce oluşturun)
INSERT INTO users (email, password_hash, full_name, is_active, department_id) 
VALUES ('admin@example.com', '$2b$12$...', 'Admin User', 1, 1);

-- Rol atama
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@example.com' AND r.name = 'Admin';
```

### Yöntem 2: API Üzerinden (Admin kullanıcısı varsa)

API dokümantasyonundan (`/docs`) kullanıcı oluşturabilirsiniz.

## Giriş Yapma

1. Arayüze gidin: `http://localhost:8000`
2. Login formunda:
   - **Email:** Oluşturduğunuz kullanıcının email'i
   - **Şifre:** Kullanıcının şifresi
3. "Giriş Yap" butonuna tıklayın

## Önemli Notlar

- İlk başlatmada servislerin hazır olması 30-60 saniye sürebilir
- Health check endpoint'i (`/health`) servislerin hazır olduğunu gösterir
- Frontend ve backend aynı port üzerinden servis edilir
- API endpoint'leri `/api/` prefix'i ile başlar
- Static dosyalar `/static/` prefix'i ile servis edilir

## Hızlı Test

Tarayıcıda şu adresleri deneyin:

1. **Ana sayfa:** http://localhost:8000
2. **API Docs:** http://localhost:8000/docs
3. **Health:** http://localhost:8000/health

Hepsi çalışıyorsa, sistem hazır demektir!

