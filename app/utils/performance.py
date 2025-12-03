"""
Performance monitoring utilities
- Memory tracking (RSS, VMS, percentage)
- CPU usage tracking
- Memory leak detection
- Historical data storage
"""
import psutil
import threading
import time
from typing import Dict, List, Optional
from datetime import datetime
from collections import deque
from app.utils.logger import get_logger

logger = get_logger("performance")


class PerformanceMonitor:
    """Performance monitoring with memory and CPU tracking"""
    
    def __init__(
        self,
        check_interval: int = 60,
        max_history: int = 100,
        memory_limit_mb: Optional[int] = None,
        cpu_limit_percent: Optional[float] = None
    ):
        self.check_interval = check_interval
        self.max_history = max_history
        self.memory_limit_mb = memory_limit_mb
        self.cpu_limit_percent = cpu_limit_percent
        
        self.history: deque = deque(maxlen=max_history)
        self.monitoring = False
        self.monitor_thread: Optional[threading.Thread] = None
        self.process = psutil.Process()
        
        logger.info(f"Performance monitor initialized (interval: {check_interval}s)")
    
    def start_monitoring(self):
        """Start background monitoring"""
        if self.monitoring:
            logger.warning("Monitoring already started")
            return
        
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Performance monitoring started")
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Performance monitoring stopped")
    
    def _monitor_loop(self):
        """Background monitoring loop"""
        while self.monitoring:
            try:
                metrics = self.get_current_metrics()
                self.history.append(metrics)
                
                # Check limits
                if self.memory_limit_mb and metrics['memory_mb'] > self.memory_limit_mb:
                    logger.warning(
                        f"Memory limit exceeded: {metrics['memory_mb']:.2f} MB > {self.memory_limit_mb} MB"
                    )
                
                if self.cpu_limit_percent and metrics['cpu_percent'] > self.cpu_limit_percent:
                    logger.warning(
                        f"CPU limit exceeded: {metrics['cpu_percent']:.2f}% > {self.cpu_limit_percent}%"
                    )
                
                # Memory leak detection (check if memory is consistently increasing)
                if len(self.history) >= 10:
                    recent_memory = [m['memory_mb'] for m in list(self.history)[-10:]]
                    if all(recent_memory[i] < recent_memory[i+1] for i in range(len(recent_memory)-1)):
                        logger.warning("Potential memory leak detected: memory consistently increasing")
                
            except Exception as e:
                logger.error(f"Error in performance monitoring: {e}")
            
            time.sleep(self.check_interval)
    
    def get_current_metrics(self) -> Dict:
        """Get current performance metrics"""
        try:
            memory_info = self.process.memory_info()
            cpu_percent = self.process.cpu_percent(interval=0.1)
            memory_percent = self.process.memory_percent()
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'rss_mb': memory_info.rss / 1024 / 1024,  # Resident Set Size in MB
                'vms_mb': memory_info.vms / 1024 / 1024,   # Virtual Memory Size in MB
                'memory_mb': memory_info.rss / 1024 / 1024,
                'memory_percent': memory_percent,
                'cpu_percent': cpu_percent,
                'num_threads': self.process.num_threads(),
                'num_fds': self.process.num_fds() if hasattr(self.process, 'num_fds') else 0
            }
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e)
            }
    
    def get_history(self, limit: Optional[int] = None) -> List[Dict]:
        """Get performance history"""
        history_list = list(self.history)
        if limit:
            return history_list[-limit:]
        return history_list
    
    def get_summary(self) -> Dict:
        """Get performance summary statistics"""
        if not self.history:
            return {"message": "No data available"}
        
        history_list = list(self.history)
        memory_values = [m.get('memory_mb', 0) for m in history_list if 'memory_mb' in m]
        cpu_values = [m.get('cpu_percent', 0) for m in history_list if 'cpu_percent' in m]
        
        return {
            'data_points': len(history_list),
            'memory_mb': {
                'current': memory_values[-1] if memory_values else 0,
                'average': sum(memory_values) / len(memory_values) if memory_values else 0,
                'min': min(memory_values) if memory_values else 0,
                'max': max(memory_values) if memory_values else 0
            },
            'cpu_percent': {
                'current': cpu_values[-1] if cpu_values else 0,
                'average': sum(cpu_values) / len(cpu_values) if cpu_values else 0,
                'min': min(cpu_values) if cpu_values else 0,
                'max': max(cpu_values) if cpu_values else 0
            }
        }


# Global monitor instance
_monitor: Optional[PerformanceMonitor] = None


def get_monitor(config: Optional[object] = None) -> PerformanceMonitor:
    """Get or create performance monitor"""
    global _monitor
    
    if _monitor is None:
        if config:
            _monitor = PerformanceMonitor(
                check_interval=config.get('performance.memory_check_interval', 60),
                memory_limit_mb=config.get('performance.max_memory_mb'),
                cpu_limit_percent=config.get('performance.cpu_limit_percent')
            )
        else:
            _monitor = PerformanceMonitor()
    
    return _monitor











