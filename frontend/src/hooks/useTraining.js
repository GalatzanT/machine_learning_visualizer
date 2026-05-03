import { useState, useRef } from "react";
import { datasetAPI, trainingAPI } from "../services/api";
import { TEXT } from "../constants/text";

export const useTraining = () => {
  // State
  const [dataset, setDataset] = useState(null);
  const [learningRate, setLearningRate] = useState(0.01);
  const [model, setModel] = useState({ w: 1.0, b: 1.0 });
  const [previousModel, setPreviousModel] = useState(null);
  const [stepData, setStepData] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [explanations, setExplanations] = useState([]);
  const [lrWarning, setLrWarning] = useState(null);
  const [freezeMode, setFreezeMode] = useState(false);
  const [freezeData, setFreezeData] = useState(null);
  const [pointByPointMode, setPointByPointMode] = useState(false);
  const [currentPointData, setCurrentPointData] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentModelParameters, setCurrentModelParameters] = useState({ w: 1, b: 1 });
  const [lossHistory, setLossHistory] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    final_loss: 0,
    current_epoch: 0,
    samples: 0,
  });
  const fileInputRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Dataset Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await datasetAPI.upload(file);
      setDataset({ x: data.x_values, y: data.y_values });
      setModel({ w: 1.0, b: 1.0 });
      setPreviousModel(null);
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      setCurrentModelParameters({ w: 1, b: 1 });
      setLossHistory([]);
      setCurrentMetrics({
        final_loss: 0,
        current_epoch: 0,
        samples: data.num_points,
      });
      alert(`✅ ${TEXT.DATASET_LOADED}: ${data.num_points} ${TEXT.POINTS}`);
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleGenerateDataset = async (type) => {
    try {
      const data = await datasetAPI.generate(type);
      setDataset({ x: data.x_values, y: data.y_values });
      setModel({ w: 1.0, b: 1.0 });
      setPreviousModel(null);
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      setCurrentModelParameters({ w: 1, b: 1 });
      setLossHistory([]);
      setCurrentMetrics({
        final_loss: 0,
        current_epoch: 0,
        samples: data.num_points,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  // Training Handlers
  const handleGradientStep = async () => {
    if (!dataset) {
      alert(TEXT.NO_DATASET);
      return;
    }

    try {
      const data = await trainingAPI.gradientStep();
      setPreviousModel({ ...model });
      setModel({ w: data.w_after, b: data.b_after });
      setStepData(data);
      setCurrentEpoch(data.epoch);
      setExplanations(data.explanations);
      setFreezeMode(false);

      // Capture model parameters from step response
      setCurrentModelParameters({
        w: data.w_after,
        b: data.b_after,
      });

      // Add loss to history
      setLossHistory(prev => [...prev, data.loss_after || 0]);

      // If end of epoch, update metrics
      if (data.is_last_point) {
        setCurrentMetrics({
          final_loss: data.loss_after || 0,
          current_epoch: data.epoch,
          samples: dataset.x.length,
        });
      }
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleLearningRateChange = async (newLr) => {
    setLearningRate(newLr);
    try {
      const data = await trainingAPI.setLearningRate(newLr);
      setLrWarning(data.warnings.length > 0 ? data.warnings : null);
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleFreezeExplain = async () => {
    if (!dataset) {
      alert(TEXT.NO_DATASET);
      return;
    }

    try {
      const data = await trainingAPI.getCurrentState();
      setFreezeData(data);
      setFreezeMode(true);
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleReset = async () => {
    try {
      await trainingAPI.resetModel();
      setModel({ w: 1.0, b: 1.0 });
      setPreviousModel(null);
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      setFreezeData(null);
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      setCurrentModelParameters({ w: 1, b: 1 });
      setLossHistory([]);
      setCurrentMetrics({
        final_loss: 0,
        current_epoch: 0,
        samples: dataset?.x.length || 0,
      });
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleResetAll = async () => {
    try {
      await trainingAPI.resetAll();
      setDataset(null);
      setModel({ w: 1.0, b: 1.0 });
      setPreviousModel(null);
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setLrWarning(null);
      setFreezeMode(false);
      setFreezeData(null);
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      setCurrentModelParameters({ w: 1, b: 1 });
      setLossHistory([]);
      setCurrentMetrics({
        final_loss: 0,
        current_epoch: 0,
        samples: 0,
      });
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  // Point-by-Point Handlers
  const handlePointStep = async () => {
    if (!dataset) {
      alert(TEXT.NO_DATASET);
      return;
    }

    try {
      const data = await trainingAPI.pointStep();
      setCurrentPointData(data);
      setPointByPointMode(true);

      if (data.is_last_point) {
        setPreviousModel({ ...model });
        setModel({ w: data.w_new, b: data.b_new });
        setCurrentEpoch(data.epoch || currentEpoch + 1);

        if (data.error_categories) {
          setStepData({
            error_categories: data.error_categories,
            error_magnitudes: data.error_magnitudes,
          });
        }

        if (data.explanations) {
          setExplanations(data.explanations);
        }
      }
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }
  };

  const handleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    } else {
      setIsAutoPlaying(true);
      autoPlayRef.current = setInterval(() => {
        handlePointStep();
      }, 1000 / playbackSpeed);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (isAutoPlaying && autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        handlePointStep();
      }, 1000 / newSpeed);
    }
  };

  const handleResetPointMode = async () => {
    try {
      await trainingAPI.resetPointMode();
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    } catch (error) {
      alert(
        `${TEXT.ERROR_MESSAGE}: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  return {
    // State
    dataset,
    learningRate,
    model,
    previousModel,
    stepData,
    currentEpoch,
    explanations,
    lrWarning,
    freezeMode,
    freezeData,
    pointByPointMode,
    currentPointData,
    isAutoPlaying,
    playbackSpeed,
    currentModelParameters,
    lossHistory,
    currentMetrics,
    fileInputRef,

    // Handlers
    handleFileUpload,
    handleGenerateDataset,
    handleGradientStep,
    handleLearningRateChange,
    handleFreezeExplain,
    handleReset,
    handleResetAll,
    handlePointStep,
    handleAutoPlay,
    handleSpeedChange,
    handleResetPointMode,
  };
};
