from typing import List, Tuple, Dict, Any, Optional
import json
import math

Waypoint = Tuple[float, float, float, float]

class RouteService:
    @staticmethod
    def parse_flight_plan(plan_json: str) -> List[Dict[str, Any]]:
        """
        Парсит JSON строку с планом полета в список словарей точек.
        
        Аргументы:
            plan_json (str): JSON строка плана.
            
        Возвращает:
            List[Dict[str, Any]]: Список точек маршрута.
            
        Исключения:
            ValueError: Если JSON некорректен или не содержит нужных полей.
        """
        if not plan_json or not plan_json.strip():
            raise ValueError("Flight plan JSON is empty")
            
        try:
            data = json.loads(plan_json)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")

        if isinstance(data, dict) and "points" in data:
            data = data["points"]
            
        if not isinstance(data, list):
            raise ValueError("Flight plan must be a list of points")
            
        route = []
        for item in data:
            if not isinstance(item, dict):
                raise ValueError("Flight plan item must be an object")
                
            x = item.get("x")
            y = item.get("y")
            z = item.get("z", item.get("height")) # Support both z and height
            
            if x is None or y is None or z is None:
                raise ValueError("Flight plan item must include x, y, z/height")
                
            point = {
                "id": str(item.get("id", "")),
                "x": float(x),
                "y": float(y),
                "z": float(z),
                "yaw": float(item.get("yaw", 0.0)),
                "actions": item.get("actions", [])
            }
            route.append(point)
            
        return route

    @staticmethod
    def calculate_yaw_to_target(current_x: float, current_y: float, target_x: float, target_y: float) -> float:
        """
        Вычисляет угол рыскания (yaw) в радианах от текущей позиции к целевой.
        Использует конвенцию math.atan2(dx, dy) (0=Север, 90=Восток).
        
        Аргументы:
            current_x (float): Текущая координата X.
            current_y (float): Текущая координата Y.
            target_x (float): Целевая координата X.
            target_y (float): Целевая координата Y.
            
        Возвращает:
            float: Угол в радианах.
        """
        dx = target_x - current_x
        dy = target_y - current_y
        return math.atan2(dx, dy)

    @staticmethod
    def normalize_yaw(yaw_rad: float) -> float:
        """
        Нормализует угол yaw в диапазон 0..2pi.
        
        Аргументы:
            yaw_rad (float): Угол в радианах.
            
        Возвращает:
            float: Нормализованный угол.
        """
        return yaw_rad % (2 * math.pi)

route_service = RouteService()

def get_route_service() -> RouteService:
    """
    Зависимость для получения экземпляра RouteService.
    """
    return route_service
