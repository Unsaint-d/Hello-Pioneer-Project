from pydantic import BaseModel
from typing import List, Optional, Any

class ActionParams(BaseModel):
    angle: Optional[float] = 0.0
    targetPointId: Optional[str] = None
    duration: Optional[float] = 0.0

class Action(BaseModel):
    type: str
    params: Optional[ActionParams] = None

class MissionPoint(BaseModel):
    id: str
    x: float
    y: float
    z: float
    yaw: float = 0.0
    actions: List[Action] = []

class MissionPlan(BaseModel):
    points: List[MissionPoint]

class AvailabilityResponse(BaseModel):
    available: bool

class ConnectionResponse(BaseModel):
    connected: bool

class StatusResponse(BaseModel):
    connected: bool
    autopilot_state: str
    logs: List[str]

class BatteryResponse(BaseModel):
    voltage: float

class ControlResponse(BaseModel):
    status: str

class MessageResponse(BaseModel):
    message: str
