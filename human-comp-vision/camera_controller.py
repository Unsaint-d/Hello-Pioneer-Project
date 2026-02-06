from imports import *
from video_getter import VideoGetter
from config import CAMERA_CONFIG

class CameraController:
    def __init__(self, file_manager: Any, log_maker: Any) -> None:
        self.file_manager: Any = file_manager
        self.log_maker: Any = log_maker
        self.logfile_name: str = self.file_manager.get_logfile_name()
        self.laptop_camera: Optional[Any] = None
        self.init_cameras()

    def init_cameras(self) -> None:
        """Инициализация камеры ПК"""
        self.laptop_camera = self.init_laptop_camera()
        if self.laptop_camera is not None:
            self.log_maker.writelog(self.logfile_name, 'PC camera initialised.')
        else:
            self.log_maker.writelog(self.logfile_name, 'Camera initialisation error.')

    def init_laptop_camera(self) -> Optional[Any]:
        """Инициализация встроенной камеры ПК"""
        try:
            # Try to find camera by name using pygrabber
            target_index = -1
            try:
                from pygrabber.dshow_graph import FilterGraph
                graph = FilterGraph()
                devices = graph.get_input_devices()
                preferred_name = CAMERA_CONFIG.get('preferred_camera_name', '')
                
                if preferred_name:
                    for index, name in enumerate(devices):
                        if preferred_name.lower() in name.lower():
                            target_index = index
                            self.log_maker.writelog(self.logfile_name, f'Found preferred camera "{name}" at index {index}.')
                            print(f"✅ Найдена камера: {name} (Index {index})")
                            break
            except ImportError:
                 self.log_maker.writelog(self.logfile_name, 'pygrabber not installed, skipping name search.')
            except Exception as e:
                self.log_maker.writelog(self.logfile_name, f'Error searching camera by name: {e}')
                print(f"⚠️ Ошибка поиска камеры по имени: {e}")

            # Define indices to check
            if target_index != -1:
                indices_to_check = [target_index]
            else:
                indices_to_check = range(CAMERA_CONFIG.get('search_range', 3))

            for camera_index in indices_to_check:
                video_getter = VideoGetter(camera_index)
                if video_getter.isOpened():
                    video_getter.start()
                    time.sleep(0.5)
                    ret, frame = video_getter.read()
                    if ret and frame is not None:
                        self.log_maker.writelog(self.logfile_name, f'PC camera connected ({camera_index}).')
                        return video_getter
                    else:
                        video_getter.stop()
                else:
                    video_getter.stop()
            self.log_maker.writelog(self.logfile_name, 'PC camera not found.')
            return None
        except Exception as e:
            self.log_maker.writelog(self.logfile_name, f'PC camera initialisation error:\n{e}')
            print(f"❌ Ошибка инициализации встроенной камеры: {e}")
            return None

    def get_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Получение кадра с текущей камеры"""
        return self.get_laptop_frame()

    def get_laptop_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Получение кадра с встроенной камеры ноутбука"""
        try:
            if self.laptop_camera is not None:
                ret, frame = self.laptop_camera.read()
                if ret and frame is not None:
                    return True, frame
                else:
                    self.log_maker.writelog(self.logfile_name, 'Error while reading frame from PC camera.')
                    return False, None
            else:
                return self.get_simulation_frame()
        except Exception as e:
            self.log_maker.writelog(self.logfile_name, f'PC camera error:\n{e}')
            return self.get_simulation_frame()

    def get_simulation_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Создание тестового кадра если камеры недоступны"""
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        cv2.putText(frame, "SIMULATION MODE - NO CAMERA", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, "Press 'q' to exit", (50, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        return True, frame

    def cleanup(self) -> None:
        """Очистка ресурсов камеры"""
        if self.laptop_camera is not None:
            if isinstance(self.laptop_camera, VideoGetter):
                self.laptop_camera.stop()
            else:
                self.laptop_camera.release()
            self.log_maker.writelog(self.logfile_name, 'PC camera disconnected.')
        self.log_maker.writelog(self.logfile_name, 'Camera resources have been released.')
