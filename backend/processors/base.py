from abc import ABC, abstractmethod
import numpy as np

class BaseProcessor(ABC):
    """
    Base class for all video stream processors.
    Each plugin must inherit from this class.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        """
        The name of the processor for UI display.
        """
        pass
        
    @property
    @abstractmethod
    def description(self) -> str:
        """
        A brief description of what the processor does.
        """
        pass

    @abstractmethod
    def process(self, frame: np.ndarray) -> np.ndarray:
        """
        The primary method for frame processing.
        
        Args:
            frame: Original frame in BGR format (OpenCV/numpy array).
            
        Returns:
            np.ndarray: The processed frame with any drawings or modifications.
        """
        pass
    
    def cleanup(self):
        """
        Method for resource cleanup when the processor is disabled.
        """
        pass
