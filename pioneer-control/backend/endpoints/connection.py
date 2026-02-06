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
    Проверяет доступность IP-адреса дрона.
    
    Возвращает:
        AvailabilityResponse: Объект с полем available (bool).
    """
    available = check_ip_availability(settings.DRONE_IP)
    return AvailabilityResponse(available=available)

@router.post("/api/connect", response_model=ConnectionResponse)
def connect_drone_endpoint(drone_service: DroneService = Depends(get_drone_service)) -> ConnectionResponse:
    """
    Инициирует подключение к дрону.
    Включает логику проверки IP и повторных попыток.
    
    Аргументы:
        drone_service (DroneService): Сервис дрона.
        
    Возвращает:
        ConnectionResponse: Статус подключения.
        
    Исключения:
        HTTPException: Если IP недоступен (404) или соединение не удалось (500).
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
    Отключает дрон и останавливает текущую миссию.
    
    Аргументы:
        drone_service (DroneService): Сервис дрона.
        mission_service (MissionService): Сервис миссий.
        
    Возвращает:
        MessageResponse: Статус операции.
    """
    mission_service.stop_mission()
    drone_service.disconnect()
    return MessageResponse(message="disconnected")
