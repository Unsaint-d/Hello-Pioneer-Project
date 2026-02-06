from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DRONE_IP: str = "192.168.4.1"
    DRONE_PORT: int = 8000
    
    class Config:
        env_file = ".env"

settings = Settings()
