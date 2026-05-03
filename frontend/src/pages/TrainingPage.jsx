import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";
import { useTraining } from "../hooks/useTraining";
import { useAuth } from "../hooks/useAuth";
import { DatasetPanel } from "../components/DatasetPanel";
import { ControlPanel } from "../components/ControlPanel";
import { PointByPointPanel } from "../components/PointByPointPanel";
import { ScatterChart } from "../components/ScatterChart";
import { LossChart } from "../components/LossChart";
import { ExplanationPanel } from "../components/ExplanationPanel";
import { PointDetailsCard } from "../components/PointDetailsCard";
import { FreezeExplainPanel } from "../components/FreezeExplainPanel";
import { ContributionsTable } from "../components/ContributionsTable";
import { TEXT } from "../constants/text";
import "../index.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export function TrainingPage() {
  const auth = useAuth();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const {
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
  } = useTraining();

  const handleSaveSession = async () => {
    if (!auth.token) {
      setSaveError("Please login to save sessions");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const formattedDataset = dataset.x.map((xVal, idx) => ({
        x: xVal,
        y: dataset.y[idx],
      }));

      const sessionData = {
        algorithm_type: "Linear Regression",
        dataset: formattedDataset,
        hyperparameters: { learning_rate: learningRate },
        model_parameters: {
          w: currentModelParameters.w,
          b: currentModelParameters.b,
        },
        loss_history: lossHistory,
        metrics: {
          final_loss: lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0,
          current_epoch: currentMetrics.current_epoch,
          samples: currentMetrics.samples,  
        },
      };

      const response = await fetch(
        "http://localhost:8000/api/training-sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(sessionData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save session");
      }

      setShowSaveDialog(false);
      setSessionName("");
      alert("Session saved successfully!");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <h1>{TEXT.APP_TITLE}</h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: "-10px" }}>
        {TEXT.APP_SUBTITLE}
      </p>

      <DatasetPanel
        fileInputRef={fileInputRef}
        onFileUpload={handleFileUpload}
        onGenerate={handleGenerateDataset}
      />

      <ControlPanel
        dataset={dataset}
        learningRate={learningRate}
        lrWarning={lrWarning}
        onLearningRateChange={handleLearningRateChange}
        onGradientStep={handleGradientStep}
        onFreezeExplain={handleFreezeExplain}
        onReset={handleReset}
        onResetAll={handleResetAll}
      />

      <PointByPointPanel
        dataset={dataset}
        isAutoPlaying={isAutoPlaying}
        pointByPointMode={pointByPointMode}
        playbackSpeed={playbackSpeed}
        onPointStep={handlePointStep}
        onAutoPlay={handleAutoPlay}
        onSpeedChange={handleSpeedChange}
        onResetMode={handleResetPointMode}
      />

      {dataset && (
        <>
          <div className="info">
            {TEXT.EPOCH}: {currentEpoch} | {TEXT.MODEL}: y ={" "}
            {model.w.toFixed(4)}·x + {model.b.toFixed(4)}
            {stepData &&
              stepData.loss_after &&
              stepData.gradient_magnitude &&
              ` | ${TEXT.LOSS}: ${stepData.loss_after.toFixed(4)} | ${TEXT.GRADIENT}: ${stepData.gradient_magnitude.toFixed(4)}`}
          </div>

          {!freezeMode && <ExplanationPanel explanations={explanations} />}

          {pointByPointMode && (
            <PointDetailsCard currentPointData={currentPointData} />
          )}

          {freezeMode && (
            <FreezeExplainPanel
              freezeData={freezeData}
              onContinue={() => {
                handleReset();
              }}
            />
          )}

          <div className="charts">
            <ScatterChart
              dataset={dataset}
              model={model}
              previousModel={previousModel}
              stepData={stepData}
              currentPointData={currentPointData}
            />

            <LossChart stepData={stepData} />

            <ContributionsTable stepData={stepData} />
          </div>

          {auth.token && (
            <div style={styles.saveButtonContainer}>
              <button
                onClick={() => setShowSaveDialog(true)}
                style={styles.saveButton}
              >
                Save Session
              </button>
            </div>
          )}
        </>
      )}

      {!dataset && (
        <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
          <h2>{TEXT.LOAD_DATASET_PROMPT}</h2>
        </div>
      )}

      {showSaveDialog && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowSaveDialog(false)}
        >
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Save Training Session</h3>

            {saveError && <div style={styles.errorMessage}>{saveError}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Session Name (Optional)</label>
              <input
                type="text"
                placeholder="Linear Regression Training"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={saving}
                style={{
                  ...styles.saveDialogButton,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  saveButtonContainer: {
    textAlign: "center",
    marginTop: "30px",
    marginBottom: "30px",
  },
  saveButton: {
    padding: "12px 32px",
    background: "#0066CC",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: "20px",
  },
  errorMessage: {
    color: "#FF6B6B",
    fontSize: "14px",
    padding: "12px",
    marginBottom: "16px",
    background: "#FFF5F5",
    borderRadius: "8px",
    border: "1px solid #FFE0E0",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    color: "#1a202c",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "10px 24px",
    background: "#FFFFFF",
    color: "#4a5568",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  saveDialogButton: {
    padding: "10px 24px",
    background: "#0066CC",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
