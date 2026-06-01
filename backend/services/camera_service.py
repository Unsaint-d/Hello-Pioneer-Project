import threading
import time
import cv2
import numpy as np
import platform
import gc
from pioneer_sdk.camera import Camera
from processors.manager import plugin_manager
from services.drone_service import drone_service

try:
    from pygrabber.dshow_graph import FilterGraph
    HAS_PYGRABBER = True
except ImportError:
    HAS_PYGRABBER = False

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
        self.current_frame = None
        self.running = False
        self.thread = None
        self.video_source = 'drone'
        self.device_index = 0
        self.webcam = None
        self.camera = None
        self.camera_backends = {}
        self._cached_cameras = None
        
        self._initialized = True

    def _try_open_camera(self, index):
        """
        Attempts to open a camera by iterating through available backends (DSHOW, MSMF, Default).

        Args:
            index (int): Camera device index.

        Returns:
            tuple: A tuple containing (cv2.VideoCapture, backend_id) on success,
                   or (None, None) on failure.
        """
        if platform.system() == 'Windows':
            try:
                cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
                if cap.isOpened():
                    return cap, cv2.CAP_DSHOW
                cap.release()
            except Exception:
                pass
            
            try:
                cap = cv2.VideoCapture(index, cv2.CAP_MSMF)
                if cap.isOpened():
                    return cap, cv2.CAP_MSMF
                cap.release()
            except Exception:
                pass
        
        try:
            cap = cv2.VideoCapture(index)
            if cap.isOpened():
                return cap, cv2.CAP_ANY
            cap.release()
        except Exception:
            pass

        return None, None

    def _open_camera_by_index(self, index):
        """
        Opens a camera by its index using a known working backend or by searching for one.

        Args:
            index (int): Camera device index.

        Returns:
            cv2.VideoCapture: Video capture object or None if the camera could not be opened.
        """
        backend = self.camera_backends.get(index, None)
        cap = None
        
        if backend is not None:
             try:
                 cap = cv2.VideoCapture(index, backend)
                 if not cap.isOpened():
                     cap.release()
                     cap = None
             except Exception:
                 cap = None
        
        if cap is None:
             cap, new_backend = self._try_open_camera(index)
             if cap:
                 self.camera_backends[index] = new_backend
        
        return cap

    def set_video_source(self, source: str, device_index: int = 0):
        """
        Sets the active video source.

        Args:
            source (str): Source type ('drone' or 'local').
            device_index (int, optional): Device index for local camera. Defaults to 0.

        Raises:
            ValueError: If an invalid source is specified or camera initialization fails.
        """
        if source not in ['drone', 'local']:
            raise ValueError("Invalid source. Must be 'drone' or 'local'")
        
        if source == 'local':
            cap = self._open_camera_by_index(device_index)
            
            if cap is None or not cap.isOpened():
                  print(f"Failed to open camera {device_index} in set_video_source")
                  raise ValueError(f"Cannot open webcam with index {device_index}")
            
            cap.release()

        with self._lock:
            self.video_source = source
            self.device_index = device_index
            
            if self.webcam:
                self.webcam.release()
                self.webcam = None
            if self.camera:
                try:
                    self.camera.disconnect()
                except:
                    pass
                self.camera = None
                
        print(f"Video source switched to {source} (index: {device_index})")

    def get_video_source(self):
        """
        Returns the current video source configuration.

        Returns:
            dict: A dictionary containing 'source' and 'device_index' keys.
        """
        return {"source": self.video_source, "device_index": self.device_index}

    def get_available_cameras(self, force_refresh=False):
        """
        Retrieves a list of available local cameras.

        Args:
            force_refresh (bool, optional): Whether to force a refresh of the device list. Defaults to False.

        Returns:
            list: A list of dictionaries, each containing 'index' and 'name' for a camera.
        """
        if not force_refresh and self._cached_cameras is not None:
            return self._cached_cameras

        available_cameras = []
        self.camera_backends.clear()
        
        valid_indices = []
        for i in range(10):
            if self.video_source == 'local' and self.device_index == i and self.webcam is not None and self.webcam.isOpened():
                valid_indices.append(i)
                continue

            cap, backend = self._try_open_camera(i)
                
            if cap:
                ret, _ = cap.read()
                if ret:
                    valid_indices.append(i)
                    self.camera_backends[i] = backend
                cap.release()
            
            time.sleep(0.05)
        
        if HAS_PYGRABBER and platform.system() == 'Windows':
            try:
                graph = FilterGraph()
                devices = graph.get_input_devices()
                
                for i, name in enumerate(devices):
                    if i in valid_indices:
                        available_cameras.append({"index": i, "name": name})
                
                del graph
                gc.collect()
                self._cached_cameras = available_cameras
                return available_cameras
            except Exception as e:
                print(f"Error listing cameras with pygrabber: {e}")
        
        for i in valid_indices:
            available_cameras.append({"index": i, "name": f"Camera {i}"})
             
        self._cached_cameras = available_cameras
        return available_cameras

    def start(self):
        """
        Starts the video capture loop in a background thread.
        """
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print("Camera service started")

    def stop(self):
        """
        Stops the video capture loop and releases camera resources.
        """
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        
        if self.camera:
            try:
                self.camera.disconnect()
            except:
                pass
            self.camera = None
            
        if self.webcam:
            self.webcam.release()
            self.webcam = None
        print("Camera service stopped")

    def _capture_loop(self):
        """
        Main loop for capturing and processing video frames.
        Runs in a dedicated background thread.
        """
        while self.running:
            try:
                frame = None
                
                if self.video_source == 'drone':
                    if not drone_service.is_connected():
                        if self.camera:
                            try:
                                self.camera.disconnect()
                            except:
                                pass
                            self.camera = None
                        self.current_frame = None
                        time.sleep(1)
                        continue

                    if self.camera is None:
                        try:
                            self.camera = Camera()
                        except Exception as e:
                            print(f"Failed to connect to drone camera: {e}")
                            self.current_frame = None 
                            time.sleep(1)
                            continue
                            
                    try:
                        frame = self.camera.get_cv_frame()
                    except Exception as e:
                        print(f"Error getting frame from drone: {e}")
                        self.camera = None
                        self.current_frame = None 
                        continue

                elif self.video_source == 'local':
                    if self.webcam is None or not self.webcam.isOpened():
                        self.webcam = self._open_camera_by_index(self.device_index)

                        if self.webcam is None or not self.webcam.isOpened():
                             print(f"Failed to open local webcam {self.device_index}")
                             self.current_frame = None 
                             time.sleep(1)
                             continue
                    
                    ret, cam_frame = self.webcam.read()
                    if ret:
                        frame = cam_frame
                    else:
                        print("Failed to read from webcam")
                        self.webcam.release()
                        self.webcam = None
                        self.current_frame = None
                        time.sleep(1)

                if frame is not None:
                    processed_frame = plugin_manager.process_frame(frame)
                    
                    ret, buffer = cv2.imencode('.jpg', processed_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    
                    if ret:
                        self.current_frame = buffer.tobytes()
                else:
                    self.current_frame = None
                    time.sleep(0.01)
            except Exception as e:
                self.current_frame = None 
                time.sleep(1)

    def get_latest_frame(self):
        """
        Returns the most recently processed video frame.

        Returns:
            bytes or None: JPEG-encoded image as bytes, or None if no frame is available.
        """
        return self.current_frame

camera_service = CameraService()
