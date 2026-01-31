"""
API Routes pentru dataset management
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import DatasetUploadResponse, DatasetGenerateRequest, DatasetInfoResponse
from app.services.dataset_service import DatasetService
import io

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

# Acces la state global
from app.api.training import state

dataset_service = DatasetService()


@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload CSV cu coloanele 'x' și 'y'."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        content = await file.read()
        x, y = dataset_service.load_from_csv(io.BytesIO(content))
        
        # Resetează modelul când se încarcă date noi
        state["data"]["x"] = x
        state["data"]["y"] = y
        state["model"]["w"] = 1.0
        state["model"]["b"] = 1.0
        state["history"]["loss"] = []
        state["history"]["w"] = []
        state["history"]["b"] = []
        state["config"]["current_epoch"] = 0
        
        return DatasetUploadResponse(
            message="Dataset loaded successfully",
            num_points=len(x),
            x_range=(float(x.min()), float(x.max())),
            y_range=(float(y.min()), float(y.max())),
            x_values=x.tolist(),
            y_values=y.tolist()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading CSV: {str(e)}")


@router.post("/generate", response_model=DatasetUploadResponse)
async def generate_dataset(request: DatasetGenerateRequest):
    """Generează dataset sintetic."""
    try:
        x, y = dataset_service.generate_dataset(
            dataset_type=request.dataset_type,
            num_points=request.num_points,
            noise_level=request.noise_level,
            seed=request.seed
        )
        
        # Resetează modelul
        state["data"]["x"] = x
        state["data"]["y"] = y
        state["model"]["w"] = 1.0
        state["model"]["b"] = 1.0
        state["history"]["loss"] = []
        state["history"]["w"] = []
        state["history"]["b"] = []
        state["config"]["current_epoch"] = 0
        
        return DatasetUploadResponse(
            message=f"Generated {request.dataset_type} dataset",
            num_points=len(x),
            x_range=(float(x.min()), float(x.max())),
            y_range=(float(y.min()), float(y.max())),
            x_values=x.tolist(),
            y_values=y.tolist()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate/{dataset_type}", response_model=DatasetUploadResponse)
async def generate_dataset_simple(dataset_type: str):
    """Generează dataset sintetic - endpoint simplificat pentru compatibilitate."""
    import numpy as np
    
    np.random.seed(42)
    
    if dataset_type == "simple":
        x = np.linspace(0, 10, 20)
        y = 2 * x + 1 + np.random.normal(0, 1, 20)
        description = "Date liniare simple cu zgomot mic"
    elif dataset_type == "noisy":
        x = np.linspace(0, 10, 20)
        y = 2 * x + 1 + np.random.normal(0, 3, 20)
        description = "Date liniare cu zgomot mare"
    elif dataset_type == "outliers":
        x = np.linspace(0, 10, 20)
        y = 2 * x + 1 + np.random.normal(0, 1, 20)
        # Adaugă câțiva outlieri
        y[5] += 10
        y[15] -= 10
        description = "Date cu outlieri vizibili"
    else:
        raise HTTPException(status_code=404, detail="Dataset type not found")
    
    # Resetează modelul
    state["data"]["x"] = x
    state["data"]["y"] = y
    state["model"]["w"] = 1.0
    state["model"]["b"] = 1.0
    state["history"]["loss"] = []
    state["history"]["w"] = []
    state["history"]["b"] = []
    state["config"]["current_epoch"] = 0
    
    return DatasetUploadResponse(
        message=f"Generated {dataset_type} dataset",
        num_points=len(x),
        x_range=(float(x.min()), float(x.max())),
        y_range=(float(y.min()), float(y.max())),
        x_values=x.tolist(),
        y_values=y.tolist()
    )


@router.get("/info", response_model=DatasetInfoResponse)
async def get_dataset_info():
    """Informații despre dataset-ul curent."""
    if state["data"]["x"] is None:
        raise HTTPException(status_code=404, detail="No dataset loaded")
    
    x = state["data"]["x"]
    y = state["data"]["y"]
    
    return DatasetInfoResponse(
        num_points=len(x),
        x_range=(float(x.min()), float(x.max())),
        y_range=(float(y.min()), float(y.max())),
        x_mean=float(x.mean()),
        y_mean=float(y.mean()),
        is_loaded=True
    )




