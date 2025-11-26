"""
Configuration management with environment variable support
"""
import os
import json
from typing import Dict, Any, Optional
from pathlib import Path


class Config:
    """Application configuration manager"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from JSON file with environment variable substitution"""
        if not self.config_path.exists():
            raise FileNotFoundError(
                f"Config file not found: {self.config_path}. "
                f"Please copy config.json.example to config.json and configure it."
            )
        
        with open(self.config_path, 'r', encoding='utf-8') as f:
            config_str = f.read()
        
        # Replace environment variables in format ${VAR_NAME}
        config_str = self._substitute_env_vars(config_str)
        
        self._config = json.loads(config_str)
    
    def _substitute_env_vars(self, text: str) -> str:
        """Replace ${VAR_NAME} with environment variable values"""
        import re
        
        def replace_var(match):
            var_name = match.group(1)
            default_value = match.group(2) if match.lastindex > 1 else None
            value = os.getenv(var_name, default_value)
            if value is None:
                return match.group(0)  # Keep original if not found
            # Escape JSON special characters
            return json.dumps(value)[1:-1]  # Remove quotes from json.dumps
        
        # Pattern: ${VAR_NAME} or ${VAR_NAME:default}
        pattern = r'\$\{([^}:]+)(?::([^}]+))?\}'
        return re.sub(pattern, replace_var, text)
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value using dot notation
        Example: config.get('database.host')
        """
        keys = key_path.split('.')
        value = self._config
        
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
                if value is None:
                    return default
            else:
                return default
        
        return value
    
    def get_database_url(self) -> str:
        """Get PostgreSQL connection URL"""
        host = self.get('database.host', 'localhost')
        port = self.get('database.port', 5432)
        database = self.get('database.database', 'ticket_system')
        username = self.get('database.username', 'postgres')
        password = self.get('database.password', '')
        
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
    
    def get_async_database_url(self) -> str:
        """Get async PostgreSQL connection URL"""
        host = self.get('database.host', 'localhost')
        port = self.get('database.port', 5432)
        database = self.get('database.database', 'ticket_system')
        username = self.get('database.username', 'postgres')
        password = self.get('database.password', '')
        
        return f"postgresql+asyncpg://{username}:{password}@{host}:{port}/{database}"
    
    @property
    def secret_key(self) -> str:
        """Get secret key for JWT tokens"""
        return self.get('app.secret_key', 'change-me-in-production')
    
    @property
    def token_expire_minutes(self) -> int:
        """Get JWT token expiration time in minutes"""
        return self.get('app.token_expire_minutes', 1440)
    
    @property
    def log_level(self) -> str:
        """Get logging level"""
        return self.get('logging.level', 'INFO')
    
    @property
    def log_file_path(self) -> str:
        """Get log file path"""
        return self.get('logging.file_path', './Logs')
    
    @property
    def cors_origins(self) -> list:
        """Get CORS allowed origins"""
        return self.get('app.cors_origins', ['*'])


# Global config instance
config = Config()




