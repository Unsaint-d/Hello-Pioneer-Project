from fastapi import APIRouter, HTTPException, Depends
from services.drone_service import DroneService, get_drone_service
from core.schemas import ControlResponse

router = APIRouter()

@router.post("/api/arm", response_model=ControlResponse)
def arm_drone(drone_service: DroneService = Depends(get_drone_service)) -> ControlResponse:
    """
    Арминг дрона (включение моторов).
    
    Аргументы:
        drone_service (DroneService): Сервис дрона.
        
    Возвращает:
        ControlResponse: Статус операции.
        
    Исключения:
        HTTPException: Если дрон не подключен (400) или команда отклонена (500).
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="Drone disconnected")
    try:
        drone = drone_service.get_drone()
        if not drone.arm():
             raise HTTPException(status_code=500, detail="Arm command refused by drone")
        return ControlResponse(status="armed")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/api/disarm", response_model=ControlResponse)
def disarm_drone(drone_service: DroneService = Depends(get_drone_service)) -> ControlResponse:
    """
    Дизарминг дрона (выключение моторов).
    
    Аргументы:
        drone_service (DroneService): Сервис дрона.
        
    Возвращает:
        ControlResponse: Статус операции.
        
    Исключения:
        HTTPException: Если дрон не подключен (400) или команда отклонена (500).
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="Drone disconnected")
    try:
        drone = drone_service.get_drone()
        if not drone.disarm():
             raise HTTPException(status_code=500, detail="Disarm command refused by drone")
        return ControlResponse(status="disarmed")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
