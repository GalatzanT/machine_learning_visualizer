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
      {!dataset && (
        <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
          <h2>{TEXT.LOAD_DATASET_PROMPT}</h2>
          <div style={{ marginTop: "40px" }}>
            <DatasetPanel
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onGenerate={handleGenerateDataset}
            />
          </div>
        </div>
      )}

      {dataset && (
        <>
          <div style={styles.mainContent}>
            {/* LEFT PANEL - CONTROLS */}
            <div className="left-panel" style={styles.leftPanel}>
              {/* Dataset Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📊 Dataset</h3>
                <DatasetPanel
                  fileInputRef={fileInputRef}
                  onFileUpload={handleFileUpload}
                  onGenerate={handleGenerateDataset}
                />
              </div>

              {/* Learning Rate Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>⚙️ Learning Rate</h3>
                <div style={styles.controlGroup}>
                  <label style={styles.controlLabel}>Learning Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    value={learningRate}
                    onChange={(e) =>
                      handleLearningRateChange(parseFloat(e.target.value))
                    }
                    style={styles.controlInput}
                  />
                  {lrWarning && (
                    <div style={styles.lrWarning}>
                      {lrWarning.map((w, i) => (
                        <div key={i}>{w}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Training Controls Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎮 Training Controls</h3>
                <div style={styles.buttonColumn}>
                  <button
                    onClick={handleGradientStep}
                    disabled={!dataset}
                    style={styles.btnPrimary}
                  >
                    ▶ Next Step
                  </button>
                  <button
                    onClick={handleFreezeExplain}
                    disabled={!dataset}
                    style={styles.btnSecondary}
                  >
                    🔧 Freeze & Explain
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={!dataset}
                    style={styles.btnSecondary}
                  >
                    🔄 Reset Model
                  </button>
                  <button onClick={handleResetAll} style={styles.btnDanger}>
                    🗑️ Clear All
                  </button>
                </div>
              </div>

              {/* Point-by-Point Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎯 Point-by-Point Mode</h3>
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
              </div>

              {/* Model Status Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📈 Model Status</h3>
                <div style={styles.modelStatus}>
                  <div style={styles.statusLine}>
                    <span style={styles.statusLabel}>Epoch:</span>
                    <span style={styles.statusValue}>{currentEpoch}</span>
                  </div>
                  <div style={styles.statusLine}>
                    <span style={styles.statusLabel}>Model:</span>
                    <span style={styles.statusValue}>
                      y = {model.w.toFixed(4)}·x + {model.b.toFixed(4)}
                    </span>
                  </div>
                  {stepData && (
                    <>
                      <div style={styles.statusLine}>
                        <span style={styles.statusLabel}>Loss:</span>
                        <span style={styles.statusValue}>
                          {stepData.loss_after?.toFixed(4)}
                        </span>
                      </div>
                      <div style={styles.statusLine}>
                        <span style={styles.statusLabel}>Gradient:</span>
                        <span style={styles.statusValue}>
                          {stepData.gradient_magnitude?.toFixed(4)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - VISUALIZATIONS */}
            <div style={styles.rightPanel}>
              {/* Info Bar */}
              <div style={styles.infoBar}>
                Epoch: {currentEpoch} | Model: y = {model.w.toFixed(4)}·x +{" "}
                {model.b.toFixed(4)}
                {stepData &&
                  stepData.loss_after &&
                  stepData.gradient_magnitude &&
                  ` | Loss: ${stepData.loss_after.toFixed(4)} | Gradient: ${stepData.gradient_magnitude.toFixed(4)}`}
              </div>

              {/* Explanations */}
              {!freezeMode && <ExplanationPanel explanations={explanations} />}

              {/* Point Details */}
              {pointByPointMode && (
                <div style={styles.card}>
                  <PointDetailsCard currentPointData={currentPointData} />
                </div>
              )}

              {/* Freeze Explain */}
              {freezeMode && (
                <div style={styles.card}>
                  <FreezeExplainPanel
                    freezeData={freezeData}
                    onContinue={() => {
                      handleReset();
                    }}
                  />
                </div>
              )}

              {/* Charts Container */}
              <div style={styles.chartsContainer}>
                <div style={styles.card}>
                  <ScatterChart
                    dataset={dataset}
                    model={model}
                    previousModel={previousModel}
                    stepData={stepData}
                    currentPointData={currentPointData}
                  />
                </div>

                <div style={styles.card}>
                  <LossChart stepData={stepData} />
                </div>

                <div style={styles.card}>
                  <ContributionsTable stepData={stepData} />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          {auth.token && (
            <div style={styles.saveButtonContainer}>
              <button
                onClick={() => setShowSaveDialog(true)}
                style={styles.saveButton}
              >
                💾 Save Session
              </button>
            </div>
          )}
        </>
      )}

      {/* SAVE DIALOG */}
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
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "32px",
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
    minHeight: "calc(100vh - 200px)",
  },

  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxHeight: "calc(100vh - 180px)",
    overflowY: "auto",
    paddingRight: "8px",
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "box-shadow 0.2s ease",
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a202c",
  },

  controlGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  controlLabel: {
    fontWeight: "600",
    color: "#4a5568",
    fontSize: "14px",
  },

  controlInput: {
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
  },

  lrWarning: {
    background: "#fff3cd",
    padding: "10px",
    borderRadius: "4px",
    marginTop: "8px",
    fontSize: "13px",
    color: "#856404",
  },

  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  btnPrimary: {
    padding: "12px 24px",
    background: "#0066CC",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  btnSecondary: {
    padding: "12px 24px",
    background: "#6c757d",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  btnDanger: {
    padding: "12px 24px",
    background: "#dc3545",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  infoBar: {
    padding: "16px",
    background: "#F0F9FF",
    border: "1px solid #E0F2FE",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0369a1",
    fontWeight: "500",
    overflowX: "auto",
  },

  chartsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  modelStatus: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#1a202c",
  },

  statusLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "8px",
  },

  statusLabel: {
    fontWeight: "600",
    color: "#4a5568",
  },

  statusValue: {
    color: "#1a202c",
    fontFamily: "monospace",
  },

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
