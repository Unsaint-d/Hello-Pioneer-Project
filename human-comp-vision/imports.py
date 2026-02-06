import cv2
import mediapipe as mp
import numpy as np
import os
from datetime import datetime
import warnings
# Suppress pkg_resources deprecation warning from face_recognition_models
warnings.filterwarnings("ignore", message=".*pkg_resources is deprecated.*")
import face_recognition
import time
import threading
import queue
import logging
import multiprocessing
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Callable, Tuple, Any, List, Dict, Union