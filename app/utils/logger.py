"""
Advanced logging system with multiple handlers
- File logging with rotation
- Console logging with colors
- Windows Event Log (for critical errors)
- Structured logging support
"""
import logging
import logging.handlers
import sys
import os
from pathlib import Path
from typing import Optional
from datetime import datetime
import zipfile
import shutil

# Color codes for console output
class Colors:
    """ANSI color codes for terminal output"""
    DEBUG = '\033[36m'      # Cyan
    INFO = '\033[32m'       # Green
    WARNING = '\033[33m'    # Yellow
    ERROR = '\033[31m'      # Red
    CRITICAL = '\033[35m'   # Magenta
    RESET = '\033[0m'       # Reset
    BOLD = '\033[1m'


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""
    
    COLORS = {
        'DEBUG': Colors.DEBUG,
        'INFO': Colors.INFO,
        'WARNING': Colors.WARNING,
        'ERROR': Colors.ERROR,
        'CRITICAL': Colors.CRITICAL + Colors.BOLD,
    }
    
    def __init__(self, use_colors: bool = True, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.use_colors = use_colors and sys.stdout.isatty()
    
    def format(self, record):
        if self.use_colors and record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{Colors.RESET}"
        return super().format(record)


class Logger:
    """Advanced logger with multiple handlers"""
    
    def __init__(
        self,
        name: str,
        log_level: str = "INFO",
        log_file_path: str = "./Logs",
        max_file_size_mb: int = 10,
        backup_count: int = 5,
        enable_console: bool = True,
        enable_file: bool = True,
        enable_event_log: bool = False,
        console_colors: bool = True
    ):
        self.name = name
        self.log_file_path = Path(log_file_path)
        self.log_file_path.mkdir(parents=True, exist_ok=True)
        
        # Create logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        self.logger.handlers.clear()  # Remove existing handlers
        
        # Console handler
        if enable_console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
            
            if console_colors:
                formatter = ColoredFormatter(
                    use_colors=True,
                    fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S'
                )
            else:
                formatter = logging.Formatter(
                    fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S'
                )
            
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
        
        # File handler with rotation
        if enable_file:
            log_file = self.log_file_path / f"{name}.log"
            max_bytes = max_file_size_mb * 1024 * 1024
            
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
            
            file_formatter = logging.Formatter(
                fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
        
        # Windows Event Log handler (for critical errors only)
        if enable_event_log and sys.platform == 'win32':
            try:
                event_handler = logging.handlers.NTEventLogHandler(name)
                event_handler.setLevel(logging.CRITICAL)
                event_formatter = logging.Formatter(
                    fmt='%(name)s: %(message)s'
                )
                event_handler.setFormatter(event_formatter)
                self.logger.addHandler(event_handler)
            except Exception as e:
                # If Event Log fails, log to file
                self.logger.warning(f"Failed to initialize Windows Event Log: {e}")
    
    def archive_old_logs(self, days: int = 30) -> None:
        """Archive log files older than specified days"""
        archive_dir = self.log_file_path / "Archive"
        archive_dir.mkdir(exist_ok=True)
        
        cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
        
        for log_file in self.log_file_path.glob("*.log*"):
            if log_file.stat().st_mtime < cutoff_date:
                archive_path = archive_dir / f"{log_file.stem}_{datetime.fromtimestamp(log_file.stat().st_mtime).strftime('%Y%m%d')}.zip"
                
                try:
                    with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                        zipf.write(log_file, log_file.name)
                    
                    log_file.unlink()
                    self.logger.info(f"Archived log file: {log_file.name}")
                except Exception as e:
                    self.logger.error(f"Failed to archive {log_file.name}: {e}")
    
    def debug(self, message: str, *args, **kwargs):
        """Log debug message"""
        self.logger.debug(message, *args, **kwargs)
    
    def info(self, message: str, *args, **kwargs):
        """Log info message"""
        self.logger.info(message, *args, **kwargs)
    
    def warning(self, message: str, *args, **kwargs):
        """Log warning message"""
        self.logger.warning(message, *args, **kwargs)
    
    def error(self, message: str, *args, **kwargs):
        """Log error message"""
        self.logger.error(message, *args, **kwargs)
    
    def critical(self, message: str, *args, **kwargs):
        """Log critical message"""
        self.logger.critical(message, *args, **kwargs)
    
    def exception(self, message: str, *args, **kwargs):
        """Log exception with traceback"""
        self.logger.exception(message, *args, **kwargs)


def get_logger(name: str = "ticket_system", config: Optional[object] = None) -> Logger:
    """Factory function to create logger with config"""
    if config:
        return Logger(
            name=name,
            log_level=config.log_level,
            log_file_path=config.log_file_path,
            max_file_size_mb=config.get('logging.max_file_size_mb', 10),
            backup_count=config.get('logging.backup_count', 5),
            enable_console=config.get('logging.enable_console', True),
            enable_file=config.get('logging.enable_file', True),
            enable_event_log=config.get('logging.enable_event_log', False),
            console_colors=config.get('logging.console_colors', True)
        )
    else:
        return Logger(name=name)







