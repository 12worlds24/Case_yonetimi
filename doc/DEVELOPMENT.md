# Development Guide

## Local Development Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Git

### Setup Steps

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd "Ticket Programi"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup PostgreSQL database**
   - Create database: `ticket_system`
   - Create user with permissions
   - Update `config.json` with connection details

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with local settings
   ```

6. **Run database migrations**
   ```bash
   # Tables are created automatically on first run
   python -c "from app.database import create_tables; create_tables()"
   ```

7. **Run development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Project Structure

```
app/
├── api/              # API endpoints (routes)
├── auth/             # Authentication & authorization
├── models/           # SQLAlchemy database models
├── schemas/          # Pydantic request/response schemas
├── services/         # Business logic layer
├── utils/            # Utility functions
│   ├── logger.py     # Logging system
│   ├── retry.py      # Retry mechanism
│   └── performance.py # Performance monitoring
└── static/           # Frontend files
    ├── css/
    ├── js/
    └── templates/
```

## Code Style

### Python

- Follow PEP 8
- Use type hints
- Docstrings for functions/classes
- Maximum line length: 100 characters

### Naming Conventions

- Classes: `PascalCase`
- Functions/Variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Files: `snake_case.py`

## Adding New Features

### 1. Database Model

Create model in `app/models/`:

```python
from app.models.base import BaseModel
from sqlalchemy import Column, String

class MyModel(BaseModel):
    __tablename__ = "my_table"
    
    name = Column(String(255), nullable=False)
```

### 2. Pydantic Schema

Create schema in `app/schemas/`:

```python
from pydantic import BaseModel

class MyModelCreate(BaseModel):
    name: str

class MyModelResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
```

### 3. API Endpoint

Create endpoint in `app/api/`:

```python
from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/mymodel", tags=["MyModel"])

@router.post("/", response_model=MyModelResponse)
async def create_item(
    data: MyModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Implementation
    pass
```

### 4. Register Router

Add to `app/main.py`:

```python
from app.api import mymodel

app.include_router(mymodel.router)
```

## Testing

### Running Tests

```bash
pytest tests/
```

### Writing Tests

Create test files in `tests/` directory:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
```

## Debugging

### Enable Debug Logging

In `config.json`:
```json
{
  "logging": {
    "level": "DEBUG"
  }
}
```

### Database Query Logging

In `app/database.py`, set:
```python
engine = create_engine(
    database_url,
    echo=True  # Enable SQL query logging
)
```

## Common Tasks

### Create Migration

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Add New Dependency

1. Add to `requirements.txt`
2. Install: `pip install <package>`
3. Update Dockerfile if needed

### Database Seeding

Create seed script in `scripts/seed.py`:

```python
from app.database import get_db_context
from app.models.user import Department, Role

with get_db_context() as db:
    # Seed data
    dept = Department(name="IT", description="IT Department")
    db.add(dept)
    db.commit()
```

## Performance Optimization

### Database Queries

- Use `joinedload()` for eager loading
- Add database indexes for frequently queried fields
- Use pagination for large datasets

### Caching

Consider adding Redis for:
- Session storage
- Report caching
- API response caching

## Security Best Practices

1. **Never commit secrets** - Use `.env` and `.gitignore`
2. **Validate all inputs** - Use Pydantic schemas
3. **Use parameterized queries** - SQLAlchemy handles this
4. **Rate limiting** - Implement for public endpoints
5. **HTTPS in production** - Always use SSL/TLS

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push branch: `git push origin feature/my-feature`
4. Create pull request

## Useful Commands

```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/

# Run server with auto-reload
uvicorn app.main:app --reload

# Database shell
docker-compose exec postgres psql -U postgres -d ticket_system

# View logs
docker-compose logs -f app
```

## Troubleshooting

### Import Errors

- Ensure virtual environment is activated
- Check Python path
- Verify `__init__.py` files exist

### Database Connection Issues

- Verify PostgreSQL is running
- Check connection string in `config.json`
- Test connection: `psql -h localhost -U postgres -d ticket_system`

### Port Already in Use

- Change port in `config.json` or use `--port` flag
- Kill process using port: `netstat -ano | findstr "8000"`











