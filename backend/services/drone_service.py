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
        Пытается установить соединение с дроном с проверкой доступности IP и повторными попытками.
        
        Возвращает:
            bool: True, если соединение установлено успешно, иначе False.
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
        Инициализирует объект Pioneer и пытается подключиться.
        
        Возвращает:
            bool: True, если инициализация прошла без ошибок.
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
        Разрывает соединение с дроном и освобождает ресурсы.
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
        Возвращает экземпляр дрона.
        
        Возвращает:
            Pioneer: Объект управления дроном.
            
        Исключения:
            HTTPException: Если дрон не подключен (400).
        """
        if self.drone is None:
            raise HTTPException(status_code=400, detail="Нет соединения с дроном")
        return self.drone

    def is_connected(self) -> bool:
        """
        Проверяет статус подключения.
        
        Возвращает:
            bool: True, если дрон подключен и отвечает.
        """
        if self.drone is None:
            return False
        try:
            return self.drone.connected()
        except:
            return False

    def log_message(self, msg: str) -> None:
        """
        Добавляет сообщение в лог сервера.
        
        Аргументы:
            msg (str): Текст сообщения.
        """
        print(msg, flush=True)
        self.server_logs.append(msg)
        if len(self.server_logs) > 50:
            self.server_logs.pop(0)

    def get_logs(self) -> List[str]:
        """
        Возвращает и очищает накопленные логи.
        
        Возвращает:
            List[str]: Список сообщений.
        """
        logs = list(self.server_logs)
        self.server_logs.clear()
        return logs

# Глобальный экземпляр для Dependency Injection
drone_service = DroneService()

def get_drone_service() -> DroneService:
    """
    Зависимость для получения экземпляра DroneService.
    """
    return drone_service
