"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
from app.config import config
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("database")

# Create base class for models
Base = declarative_base()

# Database engine
engine = None
SessionLocal = None


def init_database():
    """Initialize database connection"""
    global engine, SessionLocal
    
    database_url = config.get_database_url()
    
    logger.info(f"Connecting to database: {config.get('database.host')}/{config.get('database.database')}")
    
    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=config.get('database.pool_size', 10),
        max_overflow=config.get('database.max_overflow', 20),
        pool_pre_ping=config.get('database.pool_pre_ping', True),
        echo=False,  # Set to True for SQL query logging
        connect_args={
            "connect_timeout": config.get('database.connection_timeout', 30)
        }
    )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    logger.info("Database connection initialized")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function for FastAPI to get database session
    Usage: db: Session = Depends(get_db)
    """
    if SessionLocal is None:
        init_database()
    
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database sessions
    Usage: with get_db_context() as db: ...
    """
    if SessionLocal is None:
        init_database()
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database transaction error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all database tables"""
    if engine is None:
        init_database()
    
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_tables():
    """Drop all database tables (use with caution!)"""
    if engine is None:
        init_database()
    
    logger.warning("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.warning("All database tables dropped")

