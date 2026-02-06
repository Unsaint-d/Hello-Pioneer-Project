import threading
import time
import cv2
import numpy as np
from pioneer_sdk.camera import Camera

class CameraService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(CameraService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        # Initialize camera with default settings (IP: 192.168.4.1, Port: 8888)
        self.camera = Camera()
        self.current_frame = None
        self.running = False
        self.thread = None
        self._initialized = True

    def start(self):
        """Start the video capture thread."""
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print("Camera service started")

    def stop(self):
        """Stop the video capture thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        self.camera.disconnect()
        print("Camera service stopped")

    def _capture_loop(self):
        """Continuously capture frames from the drone camera."""
        while self.running:
            try:
                # get_frame returns raw JPEG bytes
                frame = self.camera.get_frame()
                if frame is not None:
                    self.current_frame = frame
                else:
                    # Small sleep to prevent busy loop if no connection
                    time.sleep(0.01)
            except Exception as e:
                print(f"Error in camera capture loop: {e}")
                time.sleep(1)

    def get_latest_frame(self):
        """Return the latest captured frame."""
        return self.current_frame

camera_service = CameraService()
