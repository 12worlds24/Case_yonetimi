# Ticket Support System

Comprehensive support ticket management system with PostgreSQL backend, Docker Compose deployment, and flexible reporting capabilities.

## Features

- **Customer Management**: Import, create, and manage customers with flexible custom fields
- **Product Management**: Track products and associate them with customers
- **Case/Ticket Management**: Full lifecycle management of support cases
- **User & Role Management**: JWT-based authentication with RBAC
- **Flexible Reporting**: Dynamic reports with visual charts (Chart.js)
- **Import/Export**: CSV/Excel import/export capabilities
- **Advanced Logging**: Multi-level logging with rotation and Windows Event Log support
- **Retry Mechanism**: Automatic retry for database, network, and file operations
- **Performance Monitoring**: Real-time memory and CPU tracking

## Technology Stack

- **Backend**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15
- **Frontend**: HTML/CSS/JavaScript + Chart.js
- **Deployment**: Docker Compose
- **Authentication**: JWT tokens with bcrypt password hashing

## Quick Start

### Prerequisites

- Docker Desktop (Windows)
- Docker Compose

### Installation

1. **Clone or download the project**

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your database credentials and other settings.

3. **Configure application**
   ```bash
   cp config.json.example config.json
   ```
   Edit `config.json` and configure database connection, logging, SMTP, etc.

4. **Adjust ports if needed**
   If you have other services running on ports 5432 or 8000, edit `.env`:
   ```
   POSTGRES_PORT=5433  # Change if PostgreSQL already uses 5432
   APP_PORT=8001       # Change if port 8000 is in use
   ```

5. **Start services**
   ```bash
   docker-compose up -d
   ```

6. **Check logs**
   ```bash
   docker-compose logs -f app
   ```

7. **Access the application**
   - API Documentation: http://localhost:8000/docs (or your custom port)
   - Health Check: http://localhost:8000/health

### Initial Setup

After starting the services, you need to create the initial admin user. You can do this by:

1. Connecting to the database:
   ```bash
   docker-compose exec postgres psql -U postgres -d ticket_system
   ```

2. Or using a database management tool to insert the first user.

## Project Structure

```
Ticket Programi/
├── app/                    # Application code
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   └── static/           # Frontend files
├── docker/                # Docker files
├── doc/                   # Documentation
├── Logs/                  # Application logs
├── uploads/               # Uploaded files
├── docker-compose.yml     # Docker Compose config
├── config.json            # Application config
└── requirements.txt       # Python dependencies
```

## Configuration

### Environment Variables (.env)

- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `POSTGRES_PORT`: Host port for PostgreSQL (default: 5432)
- `APP_PORT`: Host port for application (default: 8000)
- `SECRET_KEY`: JWT secret key
- `SMTP_*`: SMTP configuration for email notifications

### Config.json

Main application configuration including:
- Database connection settings
- Logging configuration
- Retry settings
- Performance limits
- Report settings

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify token
- `GET /health` - Health check
- `GET /docs` - API documentation (Swagger UI)

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Restart service
docker-compose restart app

# Access container
docker-compose exec app bash
docker-compose exec postgres psql -U postgres -d ticket_system

# Rebuild after code changes
docker-compose build app
docker-compose up -d
```

## Database Backup/Restore

### Backup
```bash
docker-compose exec postgres pg_dump -U postgres ticket_system > backup.sql
```

### Restore
```bash
docker-compose exec -T postgres psql -U postgres ticket_system < backup.sql
```

## Development

### Running Locally (without Docker)

1. Install Python 3.11+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up PostgreSQL database
4. Configure `config.json`
5. Run:
   ```bash
   uvicorn app.main:app --reload
   ```

## Security Features

- SQL Injection protection (parameterized queries)
- XSS protection
- CSRF tokens
- Password hashing (bcrypt)
- JWT token expiration
- Input validation (Pydantic)
- Rate limiting ready

## Logging

Logs are stored in `./Logs/` directory with:
- Rotating file handler (configurable size)
- Console output with colors
- Windows Event Log integration (for critical errors)
- Automatic archiving of old logs

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.









