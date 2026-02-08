from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.camera_service import camera_service
import time

router = APIRouter()

class VideoSource(BaseModel):
    source: str
    device_index: int = 0

def generate_frames():
    no_frame_count = 0
    while True:
        frame = camera_service.get_latest_frame()
        if frame is not None:
            no_frame_count = 0
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            no_frame_count += 1
            # If no frame for > 5 seconds, stop stream to trigger client error/timeout
            if no_frame_count > 125:
                # Yielding invalid data to force a decoder error on the client
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\nINVALID\r\n'
                break
        
        time.sleep(0.04)

@router.get("/camera/stream")
async def video_feed():
    """
    Stream video from the drone camera using MJPEG.
    """
    if not camera_service.running:
        camera_service.start()
        
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.post("/camera/source")
async def set_video_source(source_data: VideoSource):
    """
    Set the video source ('drone' or 'local').
    """
    try:
        camera_service.set_video_source(source_data.source, source_data.device_index)
        return {"status": "success", "source": source_data.source, "device_index": source_data.device_index}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/camera/source")
async def get_video_source():
    """
    Get the current video source.
    """
    return camera_service.get_video_source()

@router.get("/camera/devices")
async def get_available_cameras(refresh: bool = False):
    """
    Get list of available local cameras.
    """
    return camera_service.get_available_cameras(force_refresh=refresh)

