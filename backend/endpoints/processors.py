from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from processors.manager import plugin_manager

router = APIRouter(tags=["processors"])

class ProcessorInfo(BaseModel):
    name: str
    description: str

class ActiveProcessorRequest(BaseModel):
    name: str

@router.get("/processors/list", response_model=List[ProcessorInfo])
async def get_processors():
    """Возвращает список доступных процессоров обработки видео"""
    return plugin_manager.get_available_processors()

@router.get("/processors/active", response_model=Optional[str])
async def get_active_processor():
    """Возвращает имя текущего активного процессора"""
    if plugin_manager.active_processor:
        return plugin_manager.active_processor.name
    return None

@router.post("/processors/set")
async def set_active_processor(request: ActiveProcessorRequest):
    """Устанавливает активный процессор"""
    success = plugin_manager.set_active_processor(request.name)
    if not success and request.name != "None":
        raise HTTPException(status_code=400, detail=f"Failed to activate processor {request.name}")
    return {"status": "ok", "active": request.name}
