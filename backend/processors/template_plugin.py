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
    Base class for post-processing modules.
    Enables separation of logic: rendering, saving, data transmission, etc.
    """
    @abstractmethod
    def handle(self, frame: np.ndarray, model_result: Any) -> np.ndarray:
        """
        Args:
            frame: The frame to process (can be drawn upon).
            model_result: Results from the neural network (e.g., detected objects).
            
        Returns:
            np.ndarray: The modified (or original) frame.
        """
        pass

    def cleanup(self):
        """
        Resource cleanup method (e.g., closing files).
        """
        pass

class BoundingBoxDrawer(BaseHandler):
    """
    Example handler that draws bounding boxes around detected objects.
    """
    def handle(self, frame: np.ndarray, model_result: Any) -> np.ndarray:
        cv2.putText(frame, "Handler: Drawer Active", (50, 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        return frame

class AsyncFileLogger(BaseHandler):
    """
    Example handler for asynchronous logging or data saving.
    Uses a queue to avoid blocking the video stream with file I/O operations.
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

class AdvancedTemplatePlugin(BaseProcessor):
    """
    An advanced plugin template supporting a chain of handlers (pipeline).
    """

    def __init__(self):
        self._name = "Advanced Modular Plugin (Template)"
        self._description = "Example with a processing chain (Pipeline)"
        
        self.model = None
        self.is_model_loaded = False
        
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
        """
        Core processing method that simulates model inference and executes the handler pipeline.
        """
        if not self.is_model_loaded:
            self._load_model()
            
        model_result = {"detections": 5, "class": "person"} 
        
        for handler in self.handlers:
            try:
                frame = handler.handle(frame, model_result)
            except Exception as e:
                print(f"Error in handler {handler.__class__.__name__}: {e}")

        cv2.putText(frame, f"Model Result: {model_result}", (50, 110), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return frame

    def cleanup(self):
        """
        Cleans up resources for all registered handlers and resets the model state.
        """
        for handler in self.handlers:
            handler.cleanup()
        
        self.model = None
        self.is_model_loaded = False
        print(f"Plugin {self.name} stopped.")

    def _load_model(self):
        """
        Simulates loading a machine learning model.
        """
        self.is_model_loaded = True