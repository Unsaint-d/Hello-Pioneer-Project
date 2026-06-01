from typing import List, Tuple, Dict, Any, Optional
import json
import math

Waypoint = Tuple[float, float, float, float]

class RouteService:
    @staticmethod
    def parse_flight_plan(plan_json: str) -> List[Dict[str, Any]]:
        """
        Parses a JSON string containing a flight plan into a list of point dictionaries.
        
        Args:
            plan_json (str): The flight plan JSON string.
            
        Returns:
            List[Dict[str, Any]]: A list of route points.
            
        Raises:
            ValueError: If the JSON is invalid or missing required fields.
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
        Calculates the yaw angle in radians from the current position to a target position.
        Uses the math.atan2(dx, dy) convention (0=North, 90=East).
        
        Args:
            current_x (float): Current X coordinate.
            current_y (float): Current Y coordinate.
            target_x (float): Target X coordinate.
            target_y (float): Target Y coordinate.
            
        Returns:
            float: Angle in radians.
        """
        dx = target_x - current_x
        dy = target_y - current_y
        return math.atan2(dx, dy)

    @staticmethod
    def normalize_yaw(yaw_rad: float) -> float:
        """
        Normalizes a yaw angle to the range [0, 2pi).
        
        Args:
            yaw_rad (float): Angle in radians.
            
        Returns:
            float: Normalized angle.
        """
        return yaw_rad % (2 * math.pi)

route_service = RouteService()

def get_route_service() -> RouteService:
    """
    Dependency for retrieving the RouteService instance.
    """
    return route_service
