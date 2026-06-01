from fastapi import APIRouter, HTTPException, Depends
from services.drone_service import DroneService, get_drone_service
from services.mission_service import MissionService, get_mission_service
from core.schemas import MissionPlan, MessageResponse

router = APIRouter()

@router.post("/api/mission/start", response_model=MessageResponse)
def start_mission_endpoint(
    plan: MissionPlan,
    mission_service: MissionService = Depends(get_mission_service),
    drone_service: DroneService = Depends(get_drone_service)
) -> MessageResponse:
    """
    Starts the execution of a mission plan.
    
    Args:
        plan (MissionPlan): Validated mission plan object.
        mission_service (MissionService): Injected mission service instance.
        drone_service (DroneService): Injected drone service instance.
        
    Returns:
        MessageResponse: Mission start status.
        
    Raises:
        HTTPException: 400 if disconnected or plan is invalid, 500 for internal errors.
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="No connection")
    
    try:
        mission_service.start_mission(plan)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return MessageResponse(message="started")

@router.post("/api/land", response_model=MessageResponse)
def land_drone_endpoint(
    mission_service: MissionService = Depends(get_mission_service),
    drone_service: DroneService = Depends(get_drone_service)
) -> MessageResponse:
    """
    Initiates an emergency landing and stops any active mission.
    
    Args:
        mission_service (MissionService): Injected mission service instance.
        drone_service (DroneService): Injected drone service instance.
        
    Returns:
        MessageResponse: Landing command status.
        
    Raises:
        HTTPException: 400 if disconnected, 500 for internal errors.
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="No connection")
        
    try:
        mission_service.land_and_disarm_now()
        return MessageResponse(message="landing_command_sent")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
