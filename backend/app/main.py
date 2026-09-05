from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.services.store import store
from app.routers import personnel, welfare, commander, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    store.initialize(seed=42)
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Sentinel Wellness — Personnel Welfare Early-Warning System",
    description="Privacy-respecting early-warning welfare risk detection system for uniformed services.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personnel.router)
app.include_router(welfare.router)
app.include_router(commander.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Sentinel Wellness API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
