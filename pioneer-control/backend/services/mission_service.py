import threading
import time
import math
from typing import List, Dict, Any, Optional, Tuple
from pioneer_sdk import Pioneer
from services.drone_service import DroneService, get_drone_service
from services.route_service import RouteService, get_route_service
from core.schemas import MissionPlan

class MissionService:
    def __init__(self, drone_service: DroneService, route_service: RouteService):
        self.drone_service = drone_service
        self.route_service = route_service
        self.mission_thread: Optional[threading.Thread] = None
        self.stop_mission_flag = False
        self.mission_running = False

    def start_mission(self, plan: MissionPlan) -> None:
        """
        Запускает миссию в отдельном потоке.
        
        Аргументы:
            plan (MissionPlan): План миссии.
            
        Исключения:
            RuntimeError: Если миссия уже запущена.
            ValueError: Если план пуст.
        """
        if self.mission_running:
             if self.mission_thread and self.mission_thread.is_alive():
                 raise RuntimeError("Миссия уже выполняется")
             else:
                 # Очистка "призрачного" состояния
                 self.mission_running = False

        if not plan.points:
             raise ValueError("В плане миссии нет точек")
             
        # Конвертируем Pydantic модели в словари для совместимости с внутренней логикой
        route = [point.model_dump() for point in plan.points]

        self.mission_thread = threading.Thread(target=self._mission_task, args=(route,))
        self.mission_thread.start()

    def stop_mission(self) -> None:
        """
        Сигнализирует о необходимости остановки миссии.
        """
        self.stop_mission_flag = True
        self.drone_service.log_message("Остановка миссии...")

    def land_and_disarm_now(self) -> None:
        """
        Немедленно инициирует посадку и последующее отключение моторов.
        Останавливает текущую миссию, если она идет.
        """
        self.stop_mission()
        # Запускаем в отдельном потоке, чтобы не блокировать запрос
        threading.Thread(target=self._land_and_disarm_task).start()

    def _land_and_disarm_task(self) -> None:
        try:
            drone = self.drone_service.get_drone()
            self.drone_service.log_message("Команда на посадку...")
            self._land_and_disarm(drone)
        except Exception as e:
            self.drone_service.log_message(f"Ошибка при посадке: {str(e)}")

    def _mission_task(self, route: List[Dict[str, Any]]) -> None:
        self.mission_running = True
        self.stop_mission_flag = False
        self.drone_service.log_message("Миссия начата")
        
        try:
            drone = self.drone_service.get_drone()
            
            if not self.stop_mission_flag:
                self.drone_service.log_message("Взлет...")
                if not drone.takeoff():
                     raise RuntimeError("Взлет отклонен или не удался")
            
            if not self.stop_mission_flag:
                self.drone_service.log_message("Выполнение маршрута...")
                self._execute_route(drone, route)
            
            if not self.stop_mission_flag:
                self.drone_service.log_message("Миссия завершена. Посадка...")
                self._land_and_disarm(drone)

        except Exception as e:
            self.drone_service.log_message(f"Ошибка миссии: {str(e)}")
        finally:
            self.mission_running = False
            self.drone_service.log_message("Задача миссии завершена")

    def _execute_route(self, pioneer: Pioneer, route: List[Dict[str, Any]]) -> None:
        current_yaw = 0.0
        
        for i, point in enumerate(route):
            if self.stop_mission_flag:
                break
            
            x = point['x']
            y = point['y']
            z = point['z']
            
            p_yaw = point['yaw']
            if p_yaw != 0.0:
                current_yaw = p_yaw

            actions = point['actions']

            self.drone_service.log_message(f"Полет к точке {i+1}: x={x:.2f}, y={y:.2f}, z={z:.2f}, yaw={current_yaw:.2f}")
            pioneer.go_to_local_point(x=x, y=y, z=z, yaw=current_yaw)
            self._wait_point_reached(pioneer)
            
            for action in actions:
                if self.stop_mission_flag:
                    break
                current_yaw = self._handle_action(pioneer, action, current_yaw, x, y, z, route, i)

    def _handle_action(self, pioneer: Pioneer, action: Dict[str, Any], current_yaw: float, x: float, y: float, z: float, route: List[Dict], current_idx: int) -> float:
        """
        Выполняет действие в точке. Возвращает обновленный yaw.
        """
        action_type = action.get('type')
        params = action.get('params', {}) or {} # Handle None
        
        if action_type == 'rotate':
            angle_deg = float(params.get('angle', 0.0))
            target_point_id = params.get('targetPointId')
            
            new_yaw = current_yaw

            if target_point_id:
                target_x, target_y = self._find_target_coords(target_point_id, route, current_idx)
                
                if target_x is not None and target_y is not None:
                     new_yaw = self.route_service.calculate_yaw_to_target(x, y, target_x, target_y)
                     
                     if angle_deg != 0:
                         new_yaw += math.radians(angle_deg)
            else:
                new_yaw += math.radians(angle_deg)
            
            new_yaw = self.route_service.normalize_yaw(new_yaw)
            
            pioneer.go_to_local_point(x=x, y=y, z=z, yaw=new_yaw)
            self._wait_point_reached(pioneer)
            return new_yaw
            
        elif action_type == 'wait':
            duration = float(params.get('duration', 0.0))
            self.drone_service.log_message(f"Ожидание {duration} секунд...")
            start_wait = time.time()
            while time.time() - start_wait < duration:
                if self.stop_mission_flag:
                    break
                time.sleep(0.1)
            self.drone_service.log_message("Ожидание завершено")
            return current_yaw
            
        elif action_type == 'land':
             pioneer.land()
             self._wait_for_landing(pioneer)
             pioneer.disarm()
             self.stop_mission_flag = True
             return current_yaw
             
        return current_yaw

    def _find_target_coords(self, target_id: str, route: List[Dict], current_idx: int) -> Tuple[Optional[float], Optional[float]]:
        if target_id == 'next':
            if current_idx + 1 < len(route):
                return route[current_idx+1]['x'], route[current_idx+1]['y']
        else:
            for p in route:
                if str(p.get('id')) == str(target_id):
                    return p['x'], p['y']
        return None, None

    def _wait_point_reached(self, pioneer: Pioneer, timeout_s: float = 60.0) -> None:
        start = time.time()
        while True:
            if self.stop_mission_flag:
                raise InterruptedError("Миссия прервана")
            if pioneer.point_reached():
                return
            if time.time() - start >= timeout_s:
                raise TimeoutError("Таймаут достижения точки")
            time.sleep(0.1)

    def _wait_for_landing(self, pioneer: Pioneer, timeout_s: float = 60.0) -> None:
        start = time.time()
        while True:
            try:
                state = pioneer.get_autopilot_state()
                if state in ["LANDED", "DISARMED", "IDLE"]:
                    return
            except:
                pass
            
            if time.time() - start >= timeout_s:
                 raise TimeoutError("Таймаут посадки")
            time.sleep(0.5)
    
    def _land_and_disarm(self, pioneer: Pioneer) -> None:
        pioneer.land()
        try:
             self._wait_for_landing(pioneer)
             pioneer.disarm()
        except Exception as e:
             self.drone_service.log_message(f"Ошибка посадки: {e}")

# Singleton
mission_service = MissionService(get_drone_service(), get_route_service())

def get_mission_service() -> MissionService:
    """
    Зависимость для получения экземпляра MissionService.
    """
    return mission_service
