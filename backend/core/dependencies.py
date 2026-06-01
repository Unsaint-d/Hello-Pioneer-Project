from fastapi import Depends, HTTPException
from services.drone_service import DroneService, get_drone_service

def verify_connected(drone_service: DroneService = Depends(get_drone_service)) -> DroneService:
    """
    Dependency to verify the connection status with the drone.
    
    Args:
        drone_service (DroneService): The drone service instance (injected via Depends).
        
    Returns:
        DroneService: The drone service instance if connected.
        
    Raises:
        HTTPException: If the drone is not connected (400).
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="Drone disconnected")
    return drone_service
