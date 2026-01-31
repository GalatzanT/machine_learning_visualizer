"""
Main entry point - versiune simplificată și organizată
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import training, dataset

# Creează aplicația FastAPI
app = FastAPI(
    title="ML Explicative System API",
    description="Backend pentru sistemul explicativ de învățare automată - Lucrare de licență UBB FMI",
    version="1.0.0"
)

# CORS pentru frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Înregistrează routerele
app.include_router(training.router)
app.include_router(dataset.router)


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "message": "ML Explicative System API",
        "version": "1.0.0",
        "endpoints": {
            "training": "/api/gradient/step, /api/state/current, /api/model/reset",
            "dataset": "/api/dataset/upload, /api/dataset/generate, /api/dataset/info",
            "config": "/api/config/learning-rate"
        }
    }


@app.get("/health")
async def health():
    """Health check pentru monitoring"""
    return {"status": "healthy"}


@app.post("/api/reset")
@app.get("/api/reset")
async def reset_all():
    """Resetează complet aplicația - wrapper care apelează reset-ul din dataset."""
    from app.api.training import state
    
    state["data"]["x"] = None
    state["data"]["y"] = None
    state["model"]["w"] = 1.0
    state["model"]["b"] = 1.0
    state["history"]["loss"] = []
    state["history"]["w"] = []
    state["history"]["b"] = []
    state["config"]["lr"] = 0.01
    state["config"]["current_epoch"] = 0
    
    return {"message": "Complete reset successful"}


