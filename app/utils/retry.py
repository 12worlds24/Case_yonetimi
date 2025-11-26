"""
Retry mechanism with exponential backoff
Supports database, network, file system, and SMTP operations
"""
import time
import random
import asyncio
from functools import wraps
from typing import Callable, Type, Tuple, Any, Optional
from inspect import iscoroutinefunction
from app.utils.logger import get_logger

logger = get_logger("retry")


class RetryError(Exception):
    """Custom exception for retry failures"""
    pass


def retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    exponential_backoff: bool = True,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable] = None
):
    """
    Retry decorator with exponential backoff
    Supports both sync and async functions
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay in seconds
        exponential_backoff: If True, delay doubles with each retry
        exceptions: Tuple of exceptions to catch and retry
        on_retry: Optional callback function called on each retry
    """
    def decorator(func: Callable) -> Callable:
        if iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs) -> Any:
                last_exception = None
                current_delay = delay
                
                for attempt in range(1, max_attempts + 1):
                    try:
                        return await func(*args, **kwargs)
                    except exceptions as e:
                        last_exception = e
                        
                        if attempt == max_attempts:
                            logger.error(
                                f"Function {func.__name__} failed after {max_attempts} attempts. "
                                f"Last error: {str(e)}"
                            )
                            raise RetryError(
                                f"Function {func.__name__} failed after {max_attempts} attempts"
                            ) from e
                        
                        logger.warning(
                            f"Function {func.__name__} failed (attempt {attempt}/{max_attempts}): {str(e)}. "
                            f"Retrying in {current_delay:.2f} seconds..."
                        )
                        
                        if on_retry:
                            try:
                                if iscoroutinefunction(on_retry):
                                    await on_retry(attempt, e)
                                else:
                                    on_retry(attempt, e)
                            except Exception as callback_error:
                                logger.error(f"Retry callback failed: {callback_error}")
                        
                        await asyncio.sleep(current_delay)
                        
                        if exponential_backoff:
                            current_delay *= 2
                        else:
                            # Add small random jitter to prevent thundering herd
                            current_delay += random.uniform(0, delay * 0.1)
                
                # Should not reach here, but just in case
                raise RetryError(f"Function {func.__name__} failed unexpectedly")
            
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs) -> Any:
                last_exception = None
                current_delay = delay
                
                for attempt in range(1, max_attempts + 1):
                    try:
                        return func(*args, **kwargs)
                    except exceptions as e:
                        last_exception = e
                        
                        if attempt == max_attempts:
                            logger.error(
                                f"Function {func.__name__} failed after {max_attempts} attempts. "
                                f"Last error: {str(e)}"
                            )
                            raise RetryError(
                                f"Function {func.__name__} failed after {max_attempts} attempts"
                            ) from e
                        
                        logger.warning(
                            f"Function {func.__name__} failed (attempt {attempt}/{max_attempts}): {str(e)}. "
                            f"Retrying in {current_delay:.2f} seconds..."
                        )
                        
                        if on_retry:
                            try:
                                on_retry(attempt, e)
                            except Exception as callback_error:
                                logger.error(f"Retry callback failed: {callback_error}")
                        
                        time.sleep(current_delay)
                        
                        if exponential_backoff:
                            current_delay *= 2
                        else:
                            # Add small random jitter to prevent thundering herd
                            current_delay += random.uniform(0, delay * 0.1)
                
                # Should not reach here, but just in case
                raise RetryError(f"Function {func.__name__} failed unexpectedly")
            
            return sync_wrapper
    return decorator


def retry_database(func: Callable) -> Callable:
    """Specialized retry for database operations"""
    from sqlalchemy.exc import OperationalError, DisconnectionError
    
    return retry(
        max_attempts=3,
        delay=2.0,
        exponential_backoff=True,
        exceptions=(OperationalError, DisconnectionError, ConnectionError)
    )(func)


def retry_network(func: Callable) -> Callable:
    """Specialized retry for network operations"""
    return retry(
        max_attempts=3,
        delay=1.0,
        exponential_backoff=True,
        exceptions=(ConnectionError, TimeoutError, OSError)
    )(func)


def retry_file_system(func: Callable) -> Callable:
    """Specialized retry for file system operations"""
    return retry(
        max_attempts=3,
        delay=0.5,
        exponential_backoff=True,
        exceptions=(IOError, OSError, PermissionError)
    )(func)


def retry_smtp(func: Callable) -> Callable:
    """Specialized retry for SMTP operations"""
    import smtplib
    
    return retry(
        max_attempts=3,
        delay=2.0,
        exponential_backoff=True,
        exceptions=(smtplib.SMTPException, ConnectionError, TimeoutError)
    )(func)




