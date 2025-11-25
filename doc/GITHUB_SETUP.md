# GitHub'a Yükleme Rehberi

## Hızlı Başlangıç

### 1. GitHub'da Yeni Repo Oluştur

1. https://github.com adresine git
2. Sağ üstteki **"+"** butonuna tıkla → **"New repository"**
3. Repository adı: `ticket-support-system` (veya istediğin isim)
4. Description: "Comprehensive support ticket management system"
5. **Public** veya **Private** seç
6. **"Initialize with README"** seçme (zaten var)
7. **"Create repository"** butonuna tıkla

### 2. Git Komutları (PowerShell)

Proje klasöründe şu komutları çalıştır:

```powershell
# Git'i başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Ticket Support System"

# GitHub repo'yu ekle (KULLANICI_ADI ve REPO_ADI'ni değiştir)
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git

# Ana branch'i main olarak ayarla
git branch -M main

# GitHub'a yükle
git push -u origin main
```

### 3. GitHub Kullanıcı Adı ve Token

Eğer GitHub kullanıcı adı/şifre sorarsa:
- Kullanıcı adı: GitHub kullanıcı adın
- Şifre: **Personal Access Token** kullan (şifre değil!)

**Personal Access Token oluşturma:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" → "Generate new token (classic)"
3. İsim ver: `ticket-system-upload`
4. Süre: `90 days` (veya istediğin)
5. Scopes: `repo` seç
6. "Generate token" → Token'ı kopyala
7. Git push sırasında şifre yerine bu token'ı kullan

## Önemli: Yüklenmeyecek Dosyalar

`.gitignore` dosyası zaten hazır. Şunlar **ASLA** yüklenmeyecek:
- ✅ `.env` (hassas bilgiler)
- ✅ `config.json` (production config)
- ✅ `Logs/*` (log dosyaları)
- ✅ `uploads/*` (yüklenen dosyalar)
- ✅ `__pycache__/` (Python cache)

## Yüklenecek Dosyalar

- ✅ Tüm kaynak kod (`app/`)
- ✅ Docker dosyaları (`docker/`, `docker-compose.yml`)
- ✅ Dokümantasyon (`doc/`, `README.md`)
- ✅ Örnek dosyalar (`config.json.example`, `.env.example`)
- ✅ `requirements.txt`

## Sonraki Adımlar

Kod değişikliklerinden sonra:

```powershell
git add .
git commit -m "Açıklayıcı mesaj"
git push
```

## Sorun Giderme

**"remote origin already exists" hatası:**
```powershell
git remote remove origin
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
```

**"Permission denied" hatası:**
- Personal Access Token kullandığından emin ol
- Token'ın `repo` yetkisi olduğunu kontrol et

**"Large files" uyarısı:**
- Büyük dosyalar varsa `.gitignore`'a ekle
- Veya Git LFS kullan
