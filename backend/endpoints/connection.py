from fastapi import APIRouter, HTTPException, Depends
from services.drone_service import DroneService, get_drone_service
from services.mission_service import MissionService, get_mission_service
from core.config import settings
from core.utils import check_ip_availability
from core.schemas import AvailabilityResponse, ConnectionResponse, MessageResponse

router = APIRouter()

@router.get("/api/availability", response_model=AvailabilityResponse)
def check_availability() -> AvailabilityResponse:
    """
    Checks if the drone's IP address is reachable.
    
    Returns:
        AvailabilityResponse: Object indicating availability status.
    """
    available = check_ip_availability(settings.DRONE_IP)
    return AvailabilityResponse(available=available)

@router.post("/api/connect", response_model=ConnectionResponse)
def connect_drone_endpoint(drone_service: DroneService = Depends(get_drone_service)) -> ConnectionResponse:
    """
    Initiates a connection to the drone, including IP checks and retry logic.
    
    Args:
        drone_service (DroneService): Injected drone service instance.
        
    Returns:
        ConnectionResponse: Connection status.
        
    Raises:
        HTTPException: 404 if IP is unreachable, 500 if connection fails.
    """
    if not drone_service.connect_with_retries():
         if not check_ip_availability(settings.DRONE_IP):
             raise HTTPException(status_code=404, detail="Drone unavailable (IP not reachable)")
         raise HTTPException(status_code=500, detail="Failed to initialize drone connection")
    
    return ConnectionResponse(connected=True)

@router.post("/api/disconnect", response_model=MessageResponse)
def disconnect_drone_endpoint(
    drone_service: DroneService = Depends(get_drone_service),
    mission_service: MissionService = Depends(get_mission_service)
) -> MessageResponse:
    """
    Disconnects from the drone and stops any active missions.
    
    Args:
        drone_service (DroneService): Injected drone service instance.
        mission_service (MissionService): Injected mission service instance.
        
    Returns:
        MessageResponse: Operation status message.
    """
    mission_service.stop_mission()
    drone_service.disconnect()
    return MessageResponse(message="disconnected")
