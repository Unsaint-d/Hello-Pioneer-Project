from abc import ABC, abstractmethod
from typing import List, Any, Optional
import numpy as np
import cv2
import threading
import queue
from .base import BaseProcessor

# --- 1. Интерфейс для дополнительных обработчиков (Handlers) ---

class BaseHandler(ABC):
    """
    Базовый класс для модулей постобработки.
    Позволяет разделить логику: отрисовка, сохранение, отправка данных и т.д.
    """
    @abstractmethod
    def handle(self, frame: np.ndarray, model_result: Any) -> np.ndarray:
        """
        :param frame: Кадр для обработки (можно рисовать на нем).
        :param model_result: Результат работы нейросети (детектированные объекты и т.д.).
        :return: Измененный (или нет) кадр.
        """
        pass

    def cleanup(self):
        """Очистка ресурсов (закрытие файлов и т.д.)"""
        pass

# --- 2. Примеры реализаций обработчиков ---

class BoundingBoxDrawer(BaseHandler):
    """Пример обработчика: Рисует рамки вокруг объектов (заглушка)."""
    def handle(self, frame: np.ndarray, model_result: Any) -> np.ndarray:
        # Пример использования результатов модели
        # if model_result and 'boxes' in model_result:
        #     for box in model_result['boxes']:
        #         cv2.rectangle(frame, ...)
        
        cv2.putText(frame, "Handler: Drawer Active", (50, 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        return frame

class AsyncFileLogger(BaseHandler):
    """
    Пример обработчика: Асинхронное логирование/сохранение.
    Использует очередь, чтобы не тормозить видеопоток файловыми операциями.
    """
    def __init__(self):
        self.queue = queue.Queue()
        self.running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def handle(self, frame: np.ndarray, model_result: Any) -> np.ndarray:
        if model_result:
            self.queue.put(model_result)
        return frame

    def _worker(self):
        while self.running:
            try:
                data = self.queue.get(timeout=1.0)
                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Logger error: {e}")

    def cleanup(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join(timeout=1.0)

# --- 3. Основной Плагин (Orchestrator) ---

class AdvancedTemplatePlugin(BaseProcessor):
    """
    Продвинутый шаблон плагина с поддержкой цепочки обработчиков.
    """

    def __init__(self):
        self._name = "Advanced Modular Plugin (Template)"
        self._description = "Пример с цепочкой обработчиков (Pipeline)"
        
        # Инициализация модели
        self.model = None
        self.is_model_loaded = False
        
        # Список обработчиков (Pipeline)
        self.handlers: List[BaseHandler] = [
            BoundingBoxDrawer(),
            AsyncFileLogger()
        ]

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    def process(self, frame: np.ndarray) -> np.ndarray:
        # 1. Инференс (Получение данных от нейросети)
        if not self.is_model_loaded:
            self._load_model()
            
        # Заглушка результата модели
        model_result = {"detections": 5, "class": "person"} 
        
        # 2. Запуск цепочки обработчиков
        # Каждый handler может модифицировать кадр или делать что-то с данными
        for handler in self.handlers:
            try:
                frame = handler.handle(frame, model_result)
            except Exception as e:
                # Ошибка в одном хендлере не должна ронять весь поток
                print(f"Error in handler {handler.__class__.__name__}: {e}")

        # Дополнительная инфо
        cv2.putText(frame, f"Model Result: {model_result}", (50, 110), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return frame

    def cleanup(self):
        # Очистка всех хендлеров
        for handler in self.handlers:
            handler.cleanup()
        
        self.model = None
        self.is_model_loaded = False
        print(f"Плагин {self.name} остановлен.")

    def _load_model(self):
        # self.model = Yolo(...)
        self.is_model_loaded = True