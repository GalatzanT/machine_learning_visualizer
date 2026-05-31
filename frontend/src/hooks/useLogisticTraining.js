import { useState, useRef, useEffect } from "react";
import { logisticTrainingAPI } from "../services/api";

export const useLogisticTraining = () => {
  const [dataset, setDataset] = useState(null);
  const [learningRate, setLearningRate] = useState(0.01);
  const [model, setModel] = useState({ w: 1.0, b: 1.0 });
  const [previousModel, setPreviousModel] = useState(null);
  const [stepData, setStepData] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [explanations, setExplanations] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    final_loss: 0,
    current_epoch: 0,
    samples: 0,
  });

  // Point-by-Point Mode State
  const [pointByPointMode, setPointByPointMode] = useState(false);
  const [currentPointData, setCurrentPointData] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const autoPlayRef = useRef(null);

  const handleGenerateDataset = async (type) => {
    const data = await logisticTrainingAPI.generateDataset(type);
    const nextDataset = { x: data.x, y: data.y };

    await logisticTrainingAPI.startTraining(nextDataset, learningRate);

    setDataset(nextDataset);
    setModel({ w: 1.0, b: 1.0 });
    setPreviousModel(null);
    setStepData(null);
    setCurrentEpoch(0);
    setExplanations([]);
    setLossHistory([]);
    setCurrentMetrics({
      final_loss: 0,
      current_epoch: 0,
      samples: nextDataset.x.length,
    });
  };

  const handleGradientStep = async () => {
    if (!dataset) {
      throw new Error("Generate a dataset first");
    }

    const data = await logisticTrainingAPI.stepTraining();

    setPreviousModel({ ...model });
    setModel({
      w: data.w_current,
      b: data.b_current,
    });
    setStepData(data);
    setExplanations(data.explanations || [data.explanation]);
    setLossHistory(data.loss_history || []);

    if (data.epoch !== undefined && data.epoch !== null) {
      setCurrentEpoch(data.epoch);
      setCurrentMetrics({
        final_loss: data.loss_after || 0,
        current_epoch: data.epoch,
        samples: dataset.x.length,
      });
    }
  };

  const handleNextEpoch = async () => {
    if (!dataset) {
      throw new Error("Generate a dataset first");
    }

    try {
      const totalSamples = dataset.x.length;
      let lastStepData = null;
      let finalLoss = 0;

      // Train through all samples in epoch
      for (let i = 0; i < totalSamples; i++) {
        const data = await logisticTrainingAPI.stepTraining();
        lastStepData = data;
        finalLoss = data.loss_after || 0;
      }

      // Update model with final step of epoch
      if (lastStepData) {
        setPreviousModel({ ...model });
        setModel({
          w: lastStepData.w_current,
          b: lastStepData.b_current,
        });
        setStepData(lastStepData);
        setExplanations(lastStepData.explanations || [lastStepData.explanation]);

        // Add final loss to history
        setLossHistory(prev => [...prev, finalLoss]);

        if (lastStepData.epoch !== undefined && lastStepData.epoch !== null) {
          setCurrentEpoch(lastStepData.epoch);
          setCurrentMetrics({
            final_loss: finalLoss,
            current_epoch: lastStepData.epoch,
            samples: totalSamples,
          });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLearningRateChange = async (newLr) => {
    setLearningRate(newLr);

    if (!dataset) {
      return;
    }

    await logisticTrainingAPI.startTraining(dataset, newLr);
    setModel({ w: 1.0, b: 1.0 });
    setPreviousModel(null);
    setStepData(null);
    setCurrentEpoch(0);
    setExplanations([]);
    setLossHistory([]);
    setPointByPointMode(false);
    setCurrentPointData(null);
    setIsAutoPlaying(false);
    setCurrentMetrics({
      final_loss: 0,
      current_epoch: 0,
      samples: dataset.x.length,
    });
  };

  // Point-by-Point Mode Handlers
  const handlePointStep = async () => {
    if (!dataset) {
      throw new Error("Generate a dataset first");
    }

    try {
      const data = await logisticTrainingAPI.stepTraining();
      
      setPointByPointMode(true);
      setCurrentPointData({
        point_index: data.point_index || 0,
        total_points: dataset.x.length,
        x_value: dataset.x[data.point_index || 0],
        y_actual: dataset.y[data.point_index || 0],
        y_predicted: data.y_predicted || 0,
        loss: data.loss_after || 0,
        contribution_w: data.contribution_w || 0,
        contribution_b: data.contribution_b || 0,
      });

      // Update model
      setPreviousModel({ ...model });
      setModel({
        w: data.w_current,
        b: data.b_current,
      });

      setStepData(data);
      setExplanations(data.explanations || [data.explanation]);
      setLossHistory(prev => [...prev, data.loss_after || 0]);

      // If end of epoch, update metrics
      if (data.is_last_point) {
        setCurrentEpoch(data.epoch || currentEpoch + 1);
        setCurrentMetrics({
          final_loss: data.loss_after || 0,
          current_epoch: data.epoch || currentEpoch + 1,
          samples: dataset.x.length,
        });
      }
    } catch (error) {
      throw error;
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

  const handleResetPointMode = () => {
    setPointByPointMode(false);
    setCurrentPointData(null);
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const handleReset = async () => {
    if (!dataset) {
      setModel({ w: 1.0, b: 1.0 });
      setPreviousModel(null);
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setLossHistory([]);
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      setCurrentMetrics({
        final_loss: 0,
        current_epoch: 0,
        samples: 0,
      });
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    await logisticTrainingAPI.startTraining(dataset, learningRate);
    setModel({ w: 1.0, b: 1.0 });
    setPreviousModel(null);
    setStepData(null);
    setCurrentEpoch(0);
    setExplanations([]);
    setLossHistory([]);
    setPointByPointMode(false);
    setCurrentPointData(null);
    setIsAutoPlaying(false);
    setCurrentMetrics({
      final_loss: 0,
      current_epoch: 0,
      samples: dataset.x.length,
    });
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const handleResetAll = () => {
    setDataset(null);
    setModel({ w: 1.0, b: 1.0 });
    setPreviousModel(null);
    setStepData(null);
    setCurrentEpoch(0);
    setExplanations([]);
    setLossHistory([]);
    setPointByPointMode(false);
    setCurrentPointData(null);
    setIsAutoPlaying(false);
    setCurrentMetrics({
      final_loss: 0,
      current_epoch: 0,
      samples: 0,
    });
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  return {
    dataset,
    learningRate,
    model,
    previousModel,
    stepData,
    currentEpoch,
    explanations,
    lossHistory,
    currentMetrics,
    pointByPointMode,
    currentPointData,
    isAutoPlaying,
    playbackSpeed,
    handleGenerateDataset,
    handleNextEpoch,
    handleGradientStep,
    handleLearningRateChange,
    handlePointStep,
    handleAutoPlay,
    handleSpeedChange,
    handleResetPointMode,
    handleReset,
    handleResetAll,
  };
};
