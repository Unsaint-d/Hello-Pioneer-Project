import threading
import time
from typing import Optional, List
from pioneer_sdk import Pioneer
from fastapi import HTTPException
from core.config import settings
from core.utils import check_ip_availability

class DroneService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DroneService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.drone: Optional[Pioneer] = None
        self.server_logs: List[str] = []
        self._initialized = True

    def connect_with_retries(self) -> bool:
        """
        Attempts to establish a connection with the drone, verifying IP availability with multiple retries.
        
        Returns:
            bool: True if connection is successful, False otherwise.
        """
        is_available = False
        for i in range(3):
            if check_ip_availability(settings.DRONE_IP):
                is_available = True
                break
            if i < 2:
                time.sleep(0.5)

        if not is_available:
            self.log_message(f"IP {settings.DRONE_IP} недоступен")
            return False

        if not self.connect():
             return False
        
        start_time = time.time()
        while time.time() - start_time < 5.0:
            if self.is_connected():
                return True
            time.sleep(0.1)
            
        return self.is_connected()

    def connect(self) -> bool:
        """
        Initializes the Pioneer object and attempts to connect.
        
        Returns:
            bool: True if initialization completed without errors.
        """
        try:
            if self.drone is not None:
                try:
                    self.drone.close_connection()
                except:
                    pass
            
            self.drone = Pioneer(ip=settings.DRONE_IP)
            self.log_message(f"Инициализация подключения к {settings.DRONE_IP}")
            return True
        except Exception as e:
            self.log_message(f"Ошибка подключения: {str(e)}")
            self.drone = None
            return False

    def disconnect(self) -> None:
        """
        Terminates the drone connection and releases resources.
        """
        if self.drone:
            try:
                self.drone.close_connection()
            except Exception as e:
                self.log_message(f"Ошибка при отключении: {str(e)}")
            finally:
                self.drone = None
                self.log_message("Отключено от дрона")

    def get_drone(self) -> Pioneer:
        """
        Returns the drone instance.
        
        Returns:
            Pioneer: Drone control object.
            
        Raises:
            HTTPException: If the drone is not connected (400).
        """
        if self.drone is None:
            raise HTTPException(status_code=400, detail="Нет соединения с дроном")
        return self.drone

    def is_connected(self) -> bool:
        """
        Checks the current connection status.
        
        Returns:
            bool: True if the drone is connected and responding.
        """
        if self.drone is None:
            return False
        try:
            return self.drone.connected()
        except:
            return False

    def log_message(self, msg: str) -> None:
        """
        Appends a message to the server log.
        
        Args:
            msg (str): Message text.
        """
        print(msg, flush=True)
        self.server_logs.append(msg)
        if len(self.server_logs) > 50:
            self.server_logs.pop(0)

    def get_logs(self) -> List[str]:
        """
        Retrieves and clears the accumulated logs.
        
        Returns:
            List[str]: List of log messages.
        """
        logs = list(self.server_logs)
        self.server_logs.clear()
        return logs

# Global instance for Dependency Injection
drone_service = DroneService()

def get_drone_service() -> DroneService:
    """
    Dependency for retrieving the DroneService instance.
    """
    return drone_service
