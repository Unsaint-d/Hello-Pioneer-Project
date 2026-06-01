from fastapi import APIRouter, HTTPException, Depends
from services.drone_service import DroneService, get_drone_service
from core.schemas import StatusResponse, BatteryResponse

router = APIRouter()

@router.get("/api/status", response_model=StatusResponse)
def status_drone(drone_service: DroneService = Depends(get_drone_service)) -> StatusResponse:
    """
    Retrieves the current drone status, including autopilot mode and logs.
    
    Args:
        drone_service (DroneService): Injected drone service instance.
        
    Returns:
        StatusResponse: Connection status, autopilot state, and server logs.
    """
    logs_to_send = drone_service.get_logs()
    
    if not drone_service.is_connected():
        return StatusResponse(connected=False, autopilot_state="DISCONNECTED", logs=logs_to_send)
        
    try:
        drone = drone_service.get_drone()
        ap_state = "UNKNOWN"
        try:
            ap_state = drone.get_autopilot_state()
        except:
            pass
        return StatusResponse(connected=True, autopilot_state=str(ap_state), logs=logs_to_send)
    except Exception:
        return StatusResponse(connected=False, autopilot_state="DISCONNECTED", logs=logs_to_send)

@router.get("/api/battery", response_model=BatteryResponse)
def battery_status(drone_service: DroneService = Depends(get_drone_service)) -> BatteryResponse:
    """
    Retrieves the current battery voltage of the drone.
    
    Args:
        drone_service (DroneService): Injected drone service instance.
        
    Returns:
        BatteryResponse: Battery voltage in Volts.
        
    Raises:
        HTTPException: 400 if disconnected, 500 if data retrieval fails.
    """
    if not drone_service.is_connected():
        raise HTTPException(status_code=400, detail="Drone disconnected")
        
    try:
        voltage = drone_service.get_drone().get_battery_status(get_last_received=True)
        if voltage is None:
            return BatteryResponse(voltage=0.0)
        return BatteryResponse(voltage=float(voltage))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
