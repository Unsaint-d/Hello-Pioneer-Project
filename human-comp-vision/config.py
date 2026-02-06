from imports import *

MEDIAPIPE_CONFIG = {
    'static_image_mode': False,
    'min_tracking_confidence': 0.35,
    'min_detection_confidence': 0.35,
    'model_complexity': 1,
    'num_poses': 1 
}

FACE_RECOGNITION_CONFIG = {
    'tolerance': 0.45,
    'cooldown_time': 5,
    'model': 'hog', # 'hog' (faster, CPU) or 'cnn' (slower, GPU/CUDA required)
    'min_interval_frames': 1 # Minimum frames to skip between recognitions (was hardcoded to 3)
}

ASYNC_CONFIG = {
    'pose_processing': True,
    'face_processing': True,
    'max_queue_size': 2,
    'processing_timeout': 2.0
}

CAMERA_CONFIG = {
    'preferred_camera_name': 'OBS Virtual Camera', # Name of the camera to search for
    'search_range': 10 # Number of indices to check if name search fails or is not used
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FOLDER = os.path.join(BASE_DIR, "database")
PHOTOS_FOLDER = os.path.join(DATABASE_FOLDER, "recognized_humans")
FACES_FOLDER = os.path.join(DATABASE_FOLDER, "recognized_faces")
LOGS_FOLDER = os.path.join(DATABASE_FOLDER, "logs")
DATABASE_PATH = os.path.join(DATABASE_FOLDER, "faces_database")