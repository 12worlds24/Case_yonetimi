# Ticket Support System

Comprehensive support ticket management system with PostgreSQL backend and Docker Compose deployment.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

## Quick Start

1. Copy `.env.example` to `.env` and configure (see [Environment Setup Guide](doc/ENV_SETUP.md))
2. Copy `config.json.example` to `config.json` and configure
3. Run `docker-compose up -d`
4. Access: http://localhost:8000/docs

**📖 Detaylı kurulum için:** [Environment Setup Guide](doc/ENV_SETUP.md)

## Documentation

Full documentation is available in the [`doc/`](doc/) folder:

- [README.md](doc/README.md) - Complete documentation
- [API.md](doc/API.md) - API reference
- [DEPLOYMENT.md](doc/DEPLOYMENT.md) - Deployment guide
- [DEVELOPMENT.md](doc/DEVELOPMENT.md) - Development guide

## Features

- Customer & Product Management
- Case/Ticket Management
- User & Role Management (RBAC)
- Flexible Reporting with Charts
- Import/Export (CSV/Excel)
- Advanced Logging & Monitoring

## Technology Stack

- Python 3.11 + FastAPI
- PostgreSQL 15
- Docker Compose
- JWT Authentication

For detailed information, see [doc/README.md](doc/README.md)
