from abc import ABC, abstractmethod
import numpy as np

class BaseProcessor(ABC):
    """
    Базовый класс для всех процессоров видеопотока.
    Каждый плагин должен наследоваться от этого класса.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        """Имя процессора для отображения в UI"""
        pass
        
    @property
    @abstractmethod
    def description(self) -> str:
        """Краткое описание того, что делает процессор"""
        pass

    @abstractmethod
    def process(self, frame: np.ndarray) -> np.ndarray:
        """
        Основной метод обработки кадра.
        :param frame: Исходный кадр в формате BGR (OpenCV/numpy array)
        :return: Обработанный кадр (с отрисовкой)
        """
        pass
    
    def cleanup(self):
        """Метод для очистки ресурсов при выключении процессора"""
        pass
