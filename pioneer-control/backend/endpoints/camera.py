from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.camera_service import camera_service
import time

router = APIRouter()

def generate_frames():
    while True:
        frame = camera_service.get_latest_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            # Optionally yield a placeholder or just wait
            pass
        
        # Limit to approx 25 FPS
        time.sleep(0.04)

@router.get("/camera/stream")
async def video_feed():
    """
    Stream video from the drone camera using MJPEG.
    """
    # Ensure service is running
    if not camera_service.running:
        camera_service.start()
        
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
