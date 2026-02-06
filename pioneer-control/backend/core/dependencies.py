from fastapi import Depends, HTTPException
from services.drone_service import DroneService, get_drone_service

def verify_connected(drone_service: DroneService = Depends(get_drone_service)) -> DroneService:
    """
    Зависимость для проверки соединения с дроном.
    
    Аргументы:
        drone_service (DroneService): Сервис дрона (injects via Depends).
        
    Возвращает:
        DroneService: Если соединение активно.
        
    Исключения:
        HTTPException: Если дрон не подключен (400).
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="Drone disconnected")
    return drone_service
