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
    Запускает выполнение миссии.
    
    Аргументы:
        plan (MissionPlan): План миссии (валидируется Pydantic).
        mission_service (MissionService): Сервис миссий.
        drone_service (DroneService): Сервис дрона.
        
    Возвращает:
        MessageResponse: Статус запуска.
        
    Исключения:
        HTTPException: Если нет соединения (400), ошибка запуска (400) или внутренняя ошибка (500).
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
    Экстренная посадка дрона. Прерывает текущую миссию.
    
    Аргументы:
        mission_service (MissionService): Сервис миссий.
        drone_service (DroneService): Сервис дрона.
        
    Возвращает:
        MessageResponse: Статус отправки команды.
        
    Исключения:
        HTTPException: Если нет соединения (400) или ошибка выполнения (500).
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="No connection")
        
    try:
        mission_service.land_and_disarm_now()
        return MessageResponse(message="landing_command_sent")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
