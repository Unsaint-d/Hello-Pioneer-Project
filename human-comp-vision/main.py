from imports import *
from camera_controller import CameraController
from pose_detector import PoseDetector
from face_recognizer import FaceRecognizer
from file_manager import FileManager
from logmaker import LogMaker

class HumanDetector:
    def __init__(self) -> None:
        self.file_manager: FileManager = FileManager()
        self.log_maker: LogMaker = LogMaker(self.file_manager)
        self.camera: CameraController = CameraController(self.file_manager, self.log_maker)
        self.pose_detector: PoseDetector = PoseDetector(self.file_manager, self.log_maker)
        self.face_recognizer: FaceRecognizer = FaceRecognizer(self.file_manager, self.log_maker)
        self.previous_human_detected: bool = False
        self.current_human_detected: bool = False
        self.frame_count: int = 0
        self.fps: int = 0
        self.logfile_name: str = self.file_manager.get_logfile_name()
        
    def update_detection_status(self, human_detected: bool, frame: np.ndarray) -> None:
        """Обновление статуса обнаружения"""
        self.current_human_detected = human_detected
        if self.current_human_detected != self.previous_human_detected:
            if self.current_human_detected:
                self.log_maker.writelog(self.logfile_name, 'Human Found.')
                self.file_manager.save_human_photo(frame)
                self.log_maker.writelog(self.logfile_name, 'Face recognition activated.')
            else:
                self.log_maker.writelog(self.logfile_name, 'Human Lost.')
                self.log_maker.writelog(self.logfile_name, 'Face recognition deactivated.')
            self.previous_human_detected = self.current_human_detected

    def show_camera_feed(self) -> None:
        """Основная функция с поиском до первого сохранения"""
        print("🚀 Запуск основного цикла обработки...")
        fps_counter = 0
        last_fps_calc = time.time()
        try:
            while True:
                fps_counter += 1
                ret, raw_frame = self.camera.get_frame()
                if not ret or raw_frame is None:
                    continue
                display_frame = raw_frame.copy()
                human_detected, display_frame = self.pose_detector.detect_and_draw_async(display_frame, self.frame_count)
                recognized_persons = self.face_recognizer.process_faces(raw_frame, self.frame_count, human_detected)
                display_frame = self.face_recognizer.draw_faces_and_message(display_frame, recognized_persons)
                if self.frame_count % 30 == 0:
                    self.update_detection_status(human_detected, raw_frame)
                current_time = time.time()
                if current_time - last_fps_calc >= 1.0:
                    self.fps = fps_counter
                    fps_counter = 0
                    last_fps_calc = current_time
                frame = self.add_info_text(display_frame, human_detected)
                cv2.imshow('Pioneer-human-detector', frame)
                self.frame_count += 1
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        except KeyboardInterrupt:
            print("\n🛑 Остановка по Ctrl+C")
        except Exception as e:
            print(f"\n❌ Критическая ошибка в основном цикле: {e}")
            self.log_maker.writelog(self.logfile_name, f'Critical error in main loop: {e}')
        finally:
            self.cleanup()

    def add_info_text(self, frame: np.ndarray, human_detected: bool) -> np.ndarray:
        """Добавление текста с полупрозрачным фоном - без темных линий"""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(frame_rgb)
        draw = ImageDraw.Draw(pil_img, 'RGBA')
        try:
            font = ImageFont.truetype("verdanab.ttf", 14)
        except:
            font = ImageFont.load_default()
        x1, y1 = 0, 0
        status_text = "ЧЕЛОВЕК ОБНАРУЖЕН" if human_detected else "ЧЕЛОВЕК НЕ ОБНАРУЖЕН"
        text_color = (127, 255, 0) if human_detected else (220, 20, 60)
        status_bbox = draw.textbbox((0, 0), status_text, font=font)
        status_width, status_height = status_bbox[2] - status_bbox[0], status_bbox[3] - status_bbox[1]
        fps_bbox = draw.textbbox((0, 0), f"FPS: {self.fps}", font=font)
        fps_width, fps_height = fps_bbox[2] - fps_bbox[0], fps_bbox[3] - fps_bbox[1]
        if self.face_recognizer.face_search_active:
            search_status = "ПОИСК ЛИЦ АКТИВЕН"
            search_color = (127, 255, 0)
        else:
            search_status = "ПОИСК ЛИЦ НЕ АКТИВЕН"
            search_color = (220, 20, 60)
        search_bbox = draw.textbbox((0, 0), search_status, font=font)
        search_width, search_height = search_bbox[2] - search_bbox[0], search_bbox[3] - search_bbox[1]
        x2, y2 = 5 + max(status_width, fps_width, search_width) + 10, 5 + status_height + 5 + fps_height + 5 + search_height + 10
        radius = 25
        points = [(x1, y1), (x2, y1), (x2, y2 - radius)]
        center_x, center_y = x2 - radius, y2 - radius
        for angle in range(0, 91, 10):
            rad = np.radians(angle)
            px = center_x + radius * np.cos(rad)
            py = center_y + radius * np.sin(rad)
            points.append((px, py))
        points.append((x1, y2))
        points.append((x1, y1))
        draw.polygon(points, fill=(128, 128, 128, 128))
        draw.text((x1 + 5, y1 + 5), status_text, font=font, fill=text_color)
        draw.text((x1 + 5, y1 + status_height + 10), f"FPS: {self.fps}", font=font, fill=(224, 255, 255))
        draw.text((x1 + 5, y1 + status_height + fps_height + 15), search_status, font=font, fill=search_color)
        result = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return result

    def cleanup(self) -> None:
        """Очистка ресурсов"""
        print("🧹 Очистка ресурсов...")
        try:
            self.camera.cleanup()
            self.pose_detector.cleanup()
            self.face_recognizer.cleanup()
            cv2.destroyAllWindows()
            print("✅ Все ресурсы успешно освобождены")
        except Exception as e:
            print(f"⚠️ Ошибка при очистке ресурсов: {e}")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    detector = HumanDetector()
    detector.show_camera_feed()