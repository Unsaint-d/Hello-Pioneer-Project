from imports import *
from config import MEDIAPIPE_CONFIG, ASYNC_CONFIG
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os
import mediapipe_utils

logging.getLogger('mediapipe').setLevel(logging.ERROR)

def pose_worker(input_queue: multiprocessing.Queue, output_queue: multiprocessing.Queue, config: Dict[str, Any]) -> None:
    """Процесс распознавания скелета человека с использованием Tasks API"""
    
    model_path = os.path.join(os.getcwd(), 'pose_landmarker_full.task')
    if not os.path.exists(model_path):
        # Fallback to lite if full is missing, or raise error. 
        # Assuming full was downloaded.
        print(f"Error: Model file not found at {model_path}")
        return

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False,
        min_pose_detection_confidence=config.get('min_detection_confidence', 0.5),
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=config.get('min_tracking_confidence', 0.5),
        num_poses=1
    )
    detector = vision.PoseLandmarker.create_from_options(options)

    while True:
        try:
            task = input_queue.get()
            if task is None:
                break
            frame, frame_count = task
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            detection_result = detector.detect(mp_image)
            
            landmarks_data = []
            if detection_result.pose_landmarks:
                for lm in detection_result.pose_landmarks[0]:
                    landmarks_data.append({'x': lm.x, 'y': lm.y, 'z': lm.z, 'visibility': lm.visibility})
            
            output_queue.put((landmarks_data, frame_count))
        except Exception as e:
            # print(f"Pose worker error: {e}")
            continue
    
    detector.close()

class PoseDetector:
    def __init__(self, file_manager: Any, log_maker: Any) -> None:
        self.file_manager: Any = file_manager
        self.log_maker: Any = log_maker
        self.logfile_name: str = self.file_manager.get_logfile_name()
        
        self.input_queue: multiprocessing.Queue = multiprocessing.Queue(maxsize=1)
        self.output_queue: multiprocessing.Queue = multiprocessing.Queue(maxsize=1)
        self.process: Optional[multiprocessing.Process] = None
        self.last_landmarks: List[dict] = []
        
        # Async mode is always preferred for performance, but we support sync if config says so
        # Note: If sync, we need to initialize detector here. 
        # However, reusing the worker logic is cleaner. 
        # But for sync mode, we'll keep the old structure but use Tasks API.
        
        if ASYNC_CONFIG['pose_processing']:
            self.start_process()
        else:
            # Initialize sync detector
            model_path = os.path.join(os.getcwd(), 'pose_landmarker_full.task')
            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                output_segmentation_masks=False,
                min_pose_detection_confidence=MEDIAPIPE_CONFIG.get('min_detection_confidence', 0.5),
                min_pose_presence_confidence=0.5,
                min_tracking_confidence=MEDIAPIPE_CONFIG.get('min_tracking_confidence', 0.5),
                num_poses=MEDIAPIPE_CONFIG.get('num_poses', 1)
            )
            self.pose_detector = vision.PoseLandmarker.create_from_options(options)

    def start_process(self) -> None:
        self.process = multiprocessing.Process(
            target=pose_worker,
            args=(self.input_queue, self.output_queue, MEDIAPIPE_CONFIG),
            daemon=True
        )
        self.process.start()

    def detect_and_draw_async(self, frame: np.ndarray, frame_count: int) -> Tuple[bool, np.ndarray]:
        """Асинхронное обнаружение и отрисовка"""
        human_detected = False
        if self.process:
            try:
                self.input_queue.put_nowait((frame.copy(), frame_count))
            except queue.Full:
                pass
            try:
                while not self.output_queue.empty():
                    landmarks_data, _ = self.output_queue.get_nowait()
                    self.last_landmarks = landmarks_data
            except queue.Empty:
                pass
        else:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = self.pose_detector.detect(mp_image)
            
            self.last_landmarks = []
            if detection_result.pose_landmarks:
                for lm in detection_result.pose_landmarks[0]:
                    self.last_landmarks.append({'x': lm.x, 'y': lm.y, 'z': lm.z, 'visibility': lm.visibility})

        if self.last_landmarks:
            human_detected = True
            mediapipe_utils.draw_landmarks(
                frame,
                self.last_landmarks,
                mediapipe_utils.POSE_CONNECTIONS,
                {'color': (0, 255, 0), 'thickness': 2, 'circle_radius': 2},
                {'color': (255, 0, 0), 'thickness': 2}
            )
        return human_detected, frame

    def cleanup(self) -> None:
        """Очистка ресурсов"""
        if self.process:
            self.input_queue.put(None)
            self.process.join(timeout=1.0)
            if self.process.is_alive():
                self.process.terminate()
        elif hasattr(self, 'pose_detector'):
            self.pose_detector.close()
