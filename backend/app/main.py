import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.services.store import store
from app.routers import personnel, welfare, commander, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: initialize synthetic dataset & fit interpretable risk model
    store.initialize(seed=42)
    yield

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

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Sentinel Wellness API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Check all possible locations for built static frontend dist
possible_dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath("/app/frontend/dist"),
    os.path.abspath("./frontend/dist"),
    os.path.abspath("../frontend/dist")
]

frontend_dist = None
for path in possible_dist_paths:
    if os.path.exists(path) and os.path.isdir(path):
        frontend_dist = path
        break

if frontend_dist:
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "service": "Sentinel Wellness API",
            "version": "1.0.0",
            "documentation": "/docs",
            "notice": "Frontend dist not detected; serving API mode."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
