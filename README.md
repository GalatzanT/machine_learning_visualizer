# Linear Regression Visualizer

MVP application for visualizing linear regression with gradient descent.

## Structure

```
backend/     - Python FastAPI backend
frontend/    - React + Vite frontend
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Server runs on http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:3000

## Usage

1. Upload a CSV file with 2 columns (x, y)
2. Set learning rate and epochs
3. Click "Start Training" for full training or "Next Step" for step-by-step
4. View the regression line and loss evolution in real-time

Sample dataset included: `sample_data.csv`
