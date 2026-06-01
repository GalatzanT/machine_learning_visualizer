"""
Main entry point for ML Education API

FastAPI application for machine learning education system with:
    - User authentication and JWT tokens
    - Training session management
    - Dataset handling
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from app.routers import auth, datasets, logistic_training, training_sessions, knn_training, knn_datasets, dt_interactive, kmeans_interactive
from app.api import training, dataset

# Initialize database
init_db()

# Create FastAPI application
app = FastAPI(
    title="ML Education API",
    description="Backend for ML education system - Licență UBB FMI",
    version="2.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Authentication routes (no prefix)
app.include_router(auth.router, tags=["authentication"])

# Training sessions routes (with /api prefix)
app.include_router(training_sessions.router)

# Logistic regression routes
app.include_router(datasets.router)
app.include_router(logistic_training.router)

# KNN routes
app.include_router(knn_training.router)
app.include_router(knn_datasets.router)

# Decision Tree Interactive routes
app.include_router(dt_interactive.router)

# K-Means Interactive routes
app.include_router(kmeans_interactive.router)

# Legacy routes for dataset and training
app.include_router(training.router)
app.include_router(dataset.router)

@app.get("/")
async def root() -> dict:
    """
    Health check and API information endpoint.
    
    Returns:
        Basic API information and available endpoints
    """
    return {
        "status": "online",
        "message": "ML Education API",
        "version": "2.0.0",
        "endpoints": {
            "authentication": {
                "register": "POST /register",
                "login": "POST /login",
                "logout": "POST /logout"
            },
            "training_sessions": {
                "create": "POST /api/training-sessions",
                "list": "GET /api/training-sessions",
                "get": "GET /api/training-sessions/{session_id}",
                "update": "PUT /api/training-sessions/{session_id}",
                "delete": "DELETE /api/training-sessions/{session_id}"
            },
            "training": {
                "gradient_step": "GET /api/gradient/step",
                "current_state": "GET /api/state/current",
                "reset_model": "GET /api/model/reset"
            },
            "dataset": {
                "upload": "POST /api/dataset/upload",
                "generate": "POST /api/dataset/generate",
                "info": "GET /api/dataset/info"
            }
        }
    }


@app.get("/health")
async def health() -> dict:
    """
    Health check endpoint for monitoring.
    
    Returns:
        Status indication
    """
    return {"status": "healthy"}


@app.post("/api/reset")
@app.get("/api/reset")
async def reset_all() -> dict:
    """
    Reset application state.
    
    Clears all training data and resets model parameters.
    
    Returns:
        Success message
    """
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


