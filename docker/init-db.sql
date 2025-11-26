-- Initial database setup script
-- This script runs automatically when PostgreSQL container is first created

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Set timezone
SET timezone = 'UTC';

-- Note: Tables will be created by SQLAlchemy migrations
-- This script is for initial setup only




