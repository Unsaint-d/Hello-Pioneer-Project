import os
import importlib.util
import inspect
from typing import Dict, List, Optional, Type
import logging
from .base import BaseProcessor

logger = logging.getLogger(__name__)

class PluginManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PluginManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.processors: Dict[str, Type[BaseProcessor]] = {}
        self.processors_metadata: Dict[str, Dict[str, str]] = {}
        self.active_processor: Optional[BaseProcessor] = None
        self.processors_dir = os.path.dirname(os.path.abspath(__file__))
        self._initialized = True

    def discover_plugins(self):
        """Сканирует папку processors и загружает найденные плагины"""
        self.processors.clear()
        self.processors_metadata.clear()
        
        for filename in os.listdir(self.processors_dir):
            if filename.endswith(".py") and filename not in ["__init__.py", "base.py", "manager.py"]:
                module_name = filename[:-3]
                file_path = os.path.join(self.processors_dir, filename)
                
                try:
                    spec = importlib.util.spec_from_file_location(f"processors.{module_name}", file_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        for name, obj in inspect.getmembers(module):
                            if (inspect.isclass(obj) and 
                                issubclass(obj, BaseProcessor) and 
                                obj is not BaseProcessor):
                                
                                try:
                                    temp_instance = obj()
                                    plugin_name = temp_instance.name
                                    self.processors[plugin_name] = obj
                                    self.processors_metadata[plugin_name] = {
                                        "name": plugin_name,
                                        "description": temp_instance.description
                                    }
                                    logger.info(f"Loaded processor plugin: {plugin_name}")
                                    temp_instance.cleanup()
                                except Exception as e:
                                    logger.error(f"Failed to instantiate plugin {name}: {e}")
                                    
                except Exception as e:
                    logger.error(f"Failed to load module {filename}: {e}")

    def get_available_processors(self) -> List[Dict[str, str]]:
        """Возвращает список доступных процессоров"""
        return list(self.processors_metadata.values())

    def set_active_processor(self, name: str) -> bool:
        """Устанавливает активный процессор по имени"""
        if name == "None" or name is None:
            if self.active_processor:
                self.active_processor.cleanup()
            self.active_processor = None
            return True
            
        if name in self.processors:
            if self.active_processor:
                self.active_processor.cleanup()
            
            try:
                self.active_processor = self.processors[name]()
                logger.info(f"Activated processor: {name}")
                return True
            except Exception as e:
                logger.error(f"Error activating processor {name}: {e}")
                return False
        return False

    def process_frame(self, frame):
        """Обрабатывает кадр активным процессором, если он есть"""
        if self.active_processor:
            try:
                return self.active_processor.process(frame)
            except Exception as e:
                logger.error(f"Error in processor execution: {e}")
                return frame
        return frame

plugin_manager = PluginManager()
