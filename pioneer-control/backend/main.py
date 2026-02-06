from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from endpoints import connection, telemetry, control, mission, camera

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(connection.router)
app.include_router(telemetry.router)
app.include_router(control.router)
app.include_router(mission.router)
app.include_router(camera.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
