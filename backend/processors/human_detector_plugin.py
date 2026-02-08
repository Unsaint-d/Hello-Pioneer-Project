import logging
import numpy as np
import cv2
import time
from .base import BaseProcessor

class HumanDetectorPlugin(BaseProcessor):
    def __init__(self):
        self._name = "Human & Face Detector (пример)"
        self._description = "Плейсхолдер для будущей интеграции плагина"
        self.fps = 0
        self.fps_counter = 0
        self.last_fps_calc = time.time()

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    def process(self, frame: np.ndarray) -> np.ndarray:
        self.fps_counter += 1
        current_time = time.time()
        if current_time - self.last_fps_calc >= 1.0:
            self.fps = self.fps_counter
            self.fps_counter = 0
            self.last_fps_calc = current_time

        cv2.putText(frame, "AI MODULE REMOVED", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(frame, "WAITING FOR NEW IMPLEMENTATION", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"FPS: {self.fps}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        return frame

    def cleanup(self):
        pass
