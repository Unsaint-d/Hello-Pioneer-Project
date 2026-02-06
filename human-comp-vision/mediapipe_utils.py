import cv2
import numpy as np
from typing import List, Tuple, Optional

# MediaPipe Pose Landmarks
POSE_CONNECTIONS = frozenset([
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32)
])

def draw_landmarks(image: np.ndarray, landmark_list: List[dict], connections: Optional[frozenset] = None, 
                   landmark_drawing_spec: dict = None, connection_drawing_spec: dict = None):
    """
    Draws the landmarks and the connections on the image.
    landmark_list: List of dicts with 'x', 'y', 'z', 'visibility'
    """
    if not landmark_list:
        return
    
    if image.shape[2] != 3:
        raise ValueError('Input image must contain three channel rgb data.')
        
    image_rows, image_cols, _ = image.shape
    
    # Default drawing specs
    if landmark_drawing_spec is None:
        landmark_drawing_spec = {'color': (0, 255, 0), 'thickness': 2, 'circle_radius': 2}
    if connection_drawing_spec is None:
        connection_drawing_spec = {'color': (255, 0, 0), 'thickness': 2}

    # Draw connections
    if connections:
        num_landmarks = len(landmark_list)
        for connection in connections:
            start_idx = connection[0]
            end_idx = connection[1]
            if not (0 <= start_idx < num_landmarks and 0 <= end_idx < num_landmarks):
                continue
                
            start_landmark = landmark_list[start_idx]
            end_landmark = landmark_list[end_idx]
            
            # Use visibility to decide if we should draw
            if 'visibility' in start_landmark and start_landmark['visibility'] < 0.5:
                continue
            if 'visibility' in end_landmark and end_landmark['visibility'] < 0.5:
                continue
                
            start_point = (int(start_landmark['x'] * image_cols), int(start_landmark['y'] * image_rows))
            end_point = (int(end_landmark['x'] * image_cols), int(end_landmark['y'] * image_rows))
            
            cv2.line(image, start_point, end_point, connection_drawing_spec['color'], connection_drawing_spec['thickness'])

    # Draw landmarks
    for landmark in landmark_list:
        if 'visibility' in landmark and landmark['visibility'] < 0.5:
            continue
            
        landmark_px = (int(landmark['x'] * image_cols), int(landmark['y'] * image_rows))
        cv2.circle(image, landmark_px, landmark_drawing_spec['circle_radius'], landmark_drawing_spec['color'], landmark_drawing_spec['thickness'])
