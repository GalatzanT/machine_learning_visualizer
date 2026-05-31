import { useState } from "react";

export function useKNN() {
  const [dataset, setDataset] = useState(null);
  const [k, setK] = useState(3);
  const [predictions, setPredictions] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [trainingInfo, setTrainingInfo] = useState("");
  const [decisionBoundary, setDecisionBoundary] = useState(null);

  const handleGenerateDataset = async (type) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/datasets/knn?dataset_type=${type}`
      );
      const data = await response.json();
      setDataset({ x: data.x, y: data.y });
      setPredictions([]);
      setCurrentPrediction(null);
      setTrainingInfo("");
    } catch (error) {
      console.error("Failed to generate dataset:", error);
    }
  };

  const handleChangeK = (newK) => {
    setK(newK);
  };

  const handleStartTraining = async () => {
    if (!dataset) return;

    try {
      const response = await fetch(
        "http://localhost:8000/api/knn-training/start",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            x: dataset.x,
            y: dataset.y,
            k: k
          })
        }
      );

      const data = await response.json();
      setTrainingInfo(data.message);

      // Get decision boundary
      const boundaryResponse = await fetch(
        "http://localhost:8000/api/knn-training/decision-boundary"
      );
      const boundaryData = await boundaryResponse.json();
      setDecisionBoundary(boundaryData);
    } catch (error) {
      console.error("Failed to start training:", error);
    }
  };

  const handlePredictPoint = async (x) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/knn-training/predict-point",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(x)
        }
      );

      const data = await response.json();
      setCurrentPrediction(data);
      setPredictions([...predictions, data]);
    } catch (error) {
      console.error("Failed to predict:", error);
    }
  };

  const handleReset = () => {
    setDataset(null);
    setK(3);
    setPredictions([]);
    setCurrentPrediction(null);
    setTrainingInfo("");
    setDecisionBoundary(null);
  };

  return {
    dataset,
    k,
    predictions,
    currentPrediction,
    trainingInfo,
    decisionBoundary,
    handleGenerateDataset,
    handleChangeK,
    handleStartTraining,
    handlePredictPoint,
    handleReset
  };
}
