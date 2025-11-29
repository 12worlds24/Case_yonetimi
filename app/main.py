"""
FastAPI main application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
from app.config import config
from app.database import init_database, create_tables
from app.utils.logger import get_logger
from app.utils.performance import get_monitor
from app.api import (
    auth,
    customers,
    products,
    cases,
    users,
    support_status,
    support_type,
    priority_type,
    product_category,
    product_brand,
)

logger = get_logger("main")

# Initialize FastAPI app
app = FastAPI(
    title="Ticket Support System",
    description="Comprehensive support ticket management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        logger.info("Starting Ticket Support System...")
        init_database()
        logger.info("Database initialized")
        # Create tables if they don't exist
        create_tables()
        
        # Start performance monitoring
        monitor = get_monitor(config)
        monitor.start_monitoring()
        logger.info("Performance monitoring started")
        
        logger.info("Application started successfully")
    except Exception as e:
        logger.critical(f"Failed to start application: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down application...")
    # Stop performance monitoring
    monitor = get_monitor()
    if monitor:
        monitor.stop_monitoring()


# Request middleware for logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    start_time = time.time()
    
    # Log request
    logger.info(f"{request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        return response
    except Exception as e:
        logger.exception(f"Request error: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    monitor = get_monitor()
    metrics = monitor.get_current_metrics() if monitor else {}
    
    return {
        "status": "healthy",
        "service": "Ticket Support System",
        "version": "1.0.0",
        "performance": metrics
    }


# Root endpoint - serve frontend
@app.get("/")
async def root():
    """Root endpoint - serve frontend"""
    from fastapi.responses import FileResponse
    return FileResponse("app/static/templates/index.html")

# Admin panel endpoint
@app.get("/admin.html")
async def admin_panel():
    """Admin panel endpoint"""
    from fastapi.responses import FileResponse
    return FileResponse("app/static/templates/admin.html")


# Include routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(cases.router)
app.include_router(users.router)
app.include_router(support_status.router)
app.include_router(support_type.router)
app.include_router(priority_type.router)
app.include_router(product_category.router)
app.include_router(product_brand.router)
# TODO: Include reports router when created
# app.include_router(reports.router)

