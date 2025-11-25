# Deployment Guide

## Docker Compose Deployment

### Prerequisites

- Docker Desktop (Windows) v20.10+
- Docker Compose v2.0+
- At least 2GB free disk space
- 4GB RAM recommended

### Step 1: Environment Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your settings:
   ```env
   DB_PASSWORD=your_secure_password
   SECRET_KEY=your_secret_key_here
   POSTGRES_PORT=5433  # Change if port 5432 is in use
   APP_PORT=8001       # Change if port 8000 is in use
   ```

### Step 2: Application Configuration

1. Copy config template:
   ```bash
   cp config.json.example config.json
   ```

2. Edit `config.json` with your database and application settings.

### Step 3: Port Configuration

If you have other services running on default ports:

**PostgreSQL Port Conflict:**
- If PostgreSQL is already running on port 5432, change `POSTGRES_PORT` in `.env`
- Example: `POSTGRES_PORT=5433`

**Application Port Conflict:**
- If port 8000 is in use, change `APP_PORT` in `.env`
- Example: `APP_PORT=8001`

### Step 4: Start Services

```bash
docker-compose up -d
```

This will:
- Pull PostgreSQL 15 image
- Build FastAPI application image
- Create network and volumes
- Start both containers

### Step 5: Verify Deployment

1. Check container status:
   ```bash
   docker-compose ps
   ```

2. Check application logs:
   ```bash
   docker-compose logs -f app
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:8000/health
   ```

4. Access API documentation:
   - Open browser: http://localhost:8000/docs

### Step 6: Initial Setup

1. Create initial admin user (via database):
   ```bash
   docker-compose exec postgres psql -U postgres -d ticket_system
   ```

   Then in PostgreSQL:
   ```sql
   -- Insert departments
   INSERT INTO departments (name, description) VALUES 
   ('Teknik Ekip', 'Teknik destek ekibi'),
   ('Danışmanlık', 'Danışmanlık ekibi'),
   ('IT', 'IT ekibi');

   -- Insert roles
   INSERT INTO roles (name, description) VALUES 
   ('Destek Personeli', 'Destek personeli rolü'),
   ('Admin', 'Yönetici rolü'),
   ('Yönetici', 'Yönetici rolü');

   -- Insert admin user (password: admin123)
   -- Password hash for 'admin123' using bcrypt
   INSERT INTO users (email, password_hash, full_name, is_active, department_id) 
   VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Admin User', 1, 1);

   -- Assign admin role
   INSERT INTO user_roles (user_id, role_id) 
   SELECT u.id, r.id FROM users u, roles r 
   WHERE u.email = 'admin@example.com' AND r.name = 'Admin';
   ```

2. Or use a database management tool (pgAdmin, DBeaver, etc.)

## Production Deployment

### Security Considerations

1. **Change default passwords** in `.env`
2. **Use strong SECRET_KEY** (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
3. **Restrict CORS origins** in `config.json`:
   ```json
   "cors_origins": ["https://yourdomain.com"]
   ```
4. **Use HTTPS** with reverse proxy (nginx, Traefik)
5. **Enable firewall** rules
6. **Regular backups** of database

### Reverse Proxy Setup (Nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Backup Strategy

**Automated Backup Script:**

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres ticket_system > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

**Restore from Backup:**

```bash
docker-compose exec -T postgres psql -U postgres ticket_system < backup_20240101_120000.sql
```

## Monitoring

### Logs

- Application logs: `./Logs/` directory
- Docker logs: `docker-compose logs -f app`
- PostgreSQL logs: `docker-compose logs -f postgres`

### Health Monitoring

- Health endpoint: `GET /health`
- Returns performance metrics
- Can be used with monitoring tools (Prometheus, etc.)

### Performance Monitoring

The application includes built-in performance monitoring:
- Memory usage (RSS, VMS)
- CPU usage
- Memory leak detection
- Historical data (last 100 measurements)

Access via: `GET /health`

## Troubleshooting

### Container won't start

1. Check logs: `docker-compose logs app`
2. Verify ports are not in use: `netstat -an | findstr "8000 5432"`
3. Check disk space: `docker system df`

### Database connection errors

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check database credentials in `.env`
3. Test connection: `docker-compose exec postgres psql -U postgres -d ticket_system`

### Application errors

1. Check application logs: `docker-compose logs -f app`
2. Verify config.json syntax
3. Check file permissions on `Logs/` and `uploads/` directories

### Port conflicts

1. Identify process using port:
   ```bash
   netstat -ano | findstr "8000"
   ```
2. Change port in `.env` file
3. Restart containers: `docker-compose restart`

## Updates

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build app
docker-compose up -d
```

### Update Database Schema

Database migrations are handled automatically on startup. For manual migrations:

```bash
docker-compose exec app python -m alembic upgrade head
```

## Scaling

For production scaling:

1. Use Docker Swarm or Kubernetes
2. Add load balancer (nginx, Traefik)
3. Use external PostgreSQL (managed service)
4. Implement Redis for caching
5. Use CDN for static files

