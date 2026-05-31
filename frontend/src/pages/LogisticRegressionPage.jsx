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
import { useAuth } from "../hooks/useAuth";
import { useLogisticTraining } from "../hooks/useLogisticTraining";
import { ScatterChart } from "../components/ScatterChart";
import { LossChart } from "../components/LossChart";
import { ExplanationPanel } from "../components/ExplanationPanel";
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

export function LogisticRegressionPage() {
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
  } = useLogisticTraining();

  const generateDataset = async (type) => {
    try {
      await handleGenerateDataset(type);
    } catch (error) {
      alert(error.message || "Failed to generate logistic dataset");
    }
  };

  const nextEpoch = async () => {
    try {
      await handleNextEpoch();
    } catch (error) {
      alert(error.message || "Failed to train next epoch");
    }
  };

  const pointStep = async () => {
    try {
      await handlePointStep();
    } catch (error) {
      alert(error.message || "Failed to train point step");
    }
  };

  const autoPlay = async () => {
    try {
      await handleAutoPlay();
    } catch (error) {
      alert(error.message || "Failed to start auto-play");
    }
  };

  const updateLearningRate = async (newLr) => {
    try {
      await handleLearningRateChange(newLr);
    } catch (error) {
      alert(error.message || "Failed to update learning rate");
    }
  };

  const resetModel = async () => {
    try {
      await handleReset();
    } catch (error) {
      alert(error.message || "Failed to reset model");
    }
  };

  const handleSaveSession = async () => {
    if (!auth.token) {
      setSaveError("Please login to save sessions");
      return;
    }

    if (!dataset) {
      setSaveError("Generate a dataset before saving");
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
        algorithm_type: "Logistic Regression",
        dataset: formattedDataset,
        hyperparameters: { learning_rate: learningRate },
        model_parameters: {
          w: model.w,
          b: model.b,
        },
        loss_history: lossHistory,
        metrics: {
          final_loss: lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0,
          current_epoch: currentMetrics.current_epoch,
          samples: currentMetrics.samples,
        },
      };

      const response = await fetch("http://localhost:8000/api/training-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(sessionData),
      });

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
          <h2>Load a logistic dataset to start training</h2>
          <p style={{ color: "#666" }}>
            P(y=1) = sigmoid(w*x + b), sigmoid(z) = 1 / (1 + e^(-z))
          </p>

          <div style={{ marginTop: "30px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={() => generateDataset("simple")}>Simple</button>
            <button className="btn-secondary" onClick={() => generateDataset("overlapping")}>Overlapping</button>
            <button className="btn-secondary" onClick={() => generateDataset("noisy")}>Noisy</button>
          </div>
        </div>
      )}

      {dataset && (
        <>
          <div style={styles.mainContent}>
            <div className="left-panel" style={styles.leftPanel}>
              {/* Dataset Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📊 Dataset</h3>
                <p style={styles.cardText}>Binary classes (0/1) for classification</p>
                <div style={styles.buttonColumn}>
                  <button className="btn-secondary" onClick={() => generateDataset("simple")}>Simple</button>
                  <button className="btn-secondary" onClick={() => generateDataset("overlapping")}>Overlapping</button>
                  <button className="btn-secondary" onClick={() => generateDataset("noisy")}>Noisy</button>
                </div>
              </div>

              {/* Learning Rate Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>⚙️ Learning Rate</h3>
                <label style={styles.controlLabel}>Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  value={learningRate}
                  onChange={(e) => updateLearningRate(parseFloat(e.target.value))}
                  style={styles.controlInput}
                />
              </div>

              {/* Training Controls Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎮 Training Controls</h3>
                <div style={styles.buttonColumn}>
                  <button onClick={nextEpoch} disabled={!dataset} style={styles.btnPrimary}>▶ Next Epoch</button>
                  <button onClick={resetModel} disabled={!dataset} style={styles.btnSecondary}>🔄 Reset Model</button>
                  <button onClick={handleResetAll} style={styles.btnDanger}>🗑️ Clear All</button>
                </div>
              </div>

              {/* Point-by-Point Mode Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎯 Point-by-Point Training</h3>
                {!pointByPointMode ? (
                  <button
                    onClick={() => {
                      setShowSaveDialog(false); // Close any dialogs
                      handlePointStep(); // Start point-by-point mode
                    }}
                    disabled={!dataset}
                    style={styles.btnSecondary}
                  >
                    📊 Start Point-by-Point
                  </button>
                ) : (
                  <>
                    {/* Progress Section */}
                    <div style={styles.progressSection}>
                      <span style={styles.progressLabel}>
                        Progress: {(currentPointData?.point_index ?? 0) + 1}/{dataset?.x.length || 0}
                      </span>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${(((currentPointData?.point_index ?? 0) + 1) / (dataset?.x.length || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Auto Play Controls */}
                    <div style={styles.playControls}>
                      <button
                        onClick={autoPlay}
                        style={{
                          ...styles.btnSecondary,
                          background: isAutoPlaying ? '#27AE60' : '#6c757d'
                        }}
                      >
                        {isAutoPlaying ? '⏸ Pause' : '▶ Auto Play'}
                      </button>
                    </div>

                    {/* Speed Control */}
                    <div style={styles.speedControl}>
                      <span style={styles.speedLabel}>Speed:</span>
                      {[1, 5, 10].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          style={{
                            ...styles.speedBtn,
                            background: playbackSpeed === speed ? '#0066CC' : '#e2e8f0'
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={handleResetPointMode}
                      style={styles.btnSecondary}
                    >
                      ↻ Reset Mode
                    </button>
                  </>
                )}
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
                    <span style={styles.statusLabel}>Mode:</span>
                    <span style={styles.statusValue}>
                      {pointByPointMode ? '🎯 Point-by-Point' : '📊 Epoch'}
                    </span>
                  </div>
                  <div style={styles.statusLine}>
                    <span style={styles.statusLabel}>Model:</span>
                    <span style={styles.statusValue}>
                      P(y=1)=sigmoid({model.w.toFixed(4)}*x + {model.b.toFixed(4)})
                    </span>
                  </div>
                  {stepData && (
                    <div style={styles.statusLine}>
                      <span style={styles.statusLabel}>Loss (BCE):</span>
                      <span style={styles.statusValue}>{stepData.loss_after?.toFixed(6) || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div style={styles.rightPanel}>
              {/* Info Bar - Show epoch summary only at epoch end */}
              {stepData?.is_last_point && stepData?.epoch_summary ? (
                <div style={styles.infoBar}>
                  <strong>Epoch {stepData.epoch_summary.epoch} Summary:</strong> | 
                  Class {stepData.epoch_summary.majority_class} majority ({stepData.epoch_summary.majority_count}/{stepData.epoch_summary.total_samples}) | 
                  Avg Loss: {stepData.epoch_summary.avg_loss.toFixed(6)} 
                  {stepData.epoch_summary.loss_change < 0 ? ' ↓' : ' ↑'} 
                  ({stepData.epoch_summary.loss_change > 0 ? '+' : ''}{stepData.epoch_summary.loss_change.toFixed(6)}) | 
                  w: {stepData.epoch_summary.w_current.toFixed(4)} 
                  ({stepData.epoch_summary.w_change > 0 ? '+' : ''}{stepData.epoch_summary.w_change.toFixed(6)})
                </div>
              ) : (
                <div style={styles.infoBar}>
                  Epoch: {currentEpoch} | P(y=1)=sigmoid({model.w.toFixed(4)}·x + {model.b.toFixed(4)})
                  {stepData?.loss_after !== undefined && ` | BCE: ${stepData.loss_after.toFixed(6)}`}
                </div>
              )}

              <ExplanationPanel explanations={explanations} />

              {/* Epoch Summary - Show ONLY at epoch end during point-by-point mode */}
              {stepData?.is_last_point && stepData?.epoch_summary && pointByPointMode && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>📊 Epoch {stepData.epoch_summary.epoch} Summary</h3>
                  
                  {/* Class Distribution */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>🔴</span>
                    <span>
                      Class {stepData.epoch_summary.majority_class} is majority 
                      ({stepData.epoch_summary.majority_count}/{stepData.epoch_summary.total_samples})
                    </span>
                  </div>
                  
                  {/* Loss Change */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>📉</span>
                    <span>
                      Average Loss: {stepData.epoch_summary.avg_loss.toFixed(6)}
                      {stepData.epoch_summary.loss_change < 0 ? ' ↓ Improving' : ' ↑ Worsening'} 
                      ({stepData.epoch_summary.loss_change > 0 ? '+' : ''}{stepData.epoch_summary.loss_change.toFixed(6)})
                    </span>
                  </div>
                  
                  {/* Weight Change */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>📈</span>
                    <span>
                      Weight (w): {stepData.epoch_summary.w_current.toFixed(4)} 
                      (Δ {stepData.epoch_summary.w_change > 0 ? '+' : ''}{stepData.epoch_summary.w_change.toFixed(6)})
                    </span>
                  </div>
                  
                  {/* Bias Change */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>⬇️</span>
                    <span>
                      Bias (b): {stepData.epoch_summary.b_current.toFixed(4)} 
                      (Δ {stepData.epoch_summary.b_change > 0 ? '+' : ''}{stepData.epoch_summary.b_change.toFixed(6)})
                    </span>
                  </div>
                  
                  {/* Hardest Point */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>⭐</span>
                    <span>
                      Point {stepData.epoch_summary.hardest_point_idx + 1} has highest error 
                      ({stepData.epoch_summary.hardest_error.toFixed(4)})
                    </span>
                  </div>
                  
                  {/* Insights */}
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryIcon}>🎯</span>
                    <span>
                      {stepData.epoch_summary.loss_change < 0 
                        ? 'This epoch improved the model - keep training!'
                        : 'Loss increased - consider adjusting learning rate'}
                    </span>
                  </div>
                </div>
              )}

              {/* Current Point Analysis - Show ONLY during points (not at epoch end) */}
              {pointByPointMode && currentPointData && !stepData?.is_last_point && (
                <div style={styles.card}>
                  <h4 style={styles.cardTitle}>📍 Current Point Analysis</h4>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Point:</span>
                    <span style={styles.detailValue}>
                      {currentPointData.point_index + 1}/{currentPointData.total_points}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>X Value:</span>
                    <span style={styles.detailValue}>{currentPointData.x_value?.toFixed(4)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>True Class:</span>
                    <span style={{
                      ...styles.detailValue,
                      color: currentPointData.y_actual === 0 ? "#4299E1" : "#F56565"
                    }}>
                      {currentPointData.y_actual}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Predicted Prob:</span>
                    <span style={styles.detailValue}>
                      {currentPointData.y_predicted?.toFixed(4)}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Loss:</span>
                    <span style={styles.detailValue}>{currentPointData.loss?.toFixed(6)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Gradient w:</span>
                    <span style={styles.detailValue}>
                      {currentPointData.contribution_w?.toFixed(6)}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Gradient b:</span>
                    <span style={styles.detailValue}>
                      {currentPointData.contribution_b?.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Scatter Chart */}
              <div style={styles.card}>
                <ScatterChart
                  dataset={dataset}
                  model={model}
                  previousModel={previousModel}
                  stepData={stepData}
                  isPointByPoint={pointByPointMode}
                  currentPointIndex={currentPointData?.point_index}
                  mode="logistic"
                />
              </div>

              {/* Loss Chart */}
              <div style={styles.card}>
                <LossChart stepData={stepData} lossLabel="Binary Cross-Entropy" title="Loss (BCE)" />
              </div>
            </div>
          </div>

          {auth.token && (
            <div style={styles.saveButtonContainer}>
              <button onClick={() => setShowSaveDialog(true)} style={styles.saveButton}>
                💾 Save Session
              </button>
            </div>
          )}
        </>
      )}

      {showSaveDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowSaveDialog(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Save Logistic Training Session</h3>

            {saveError && <div style={styles.errorMessage}>{saveError}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Session Name (Optional)</label>
              <input
                type="text"
                placeholder="Logistic Regression Training"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowSaveDialog(false)} style={styles.cancelButton}>Cancel</button>
              <button
                onClick={handleSaveSession}
                disabled={saving}
                style={{ ...styles.saveDialogButton, opacity: saving ? 0.7 : 1 }}
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
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#1a202c",
  },
  cardText: {
    fontSize: "14px",
    color: "#4a5568",
    marginBottom: "12px",
  },
  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  controlLabel: {
    fontWeight: "600",
    color: "#4a5568",
    fontSize: "14px",
    marginBottom: "8px",
    display: "block",
  },
  controlInput: {
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
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
    gap: "10px",
  },
  statusLabel: {
    fontWeight: "600",
    color: "#4a5568",
  },
  statusValue: {
    color: "#1a202c",
    fontFamily: "monospace",
    textAlign: "right",
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
  },
  progressSection: {
    marginBottom: "16px",
  },
  progressLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#4a5568",
    display: "block",
    marginBottom: "8px",
  },
  progressBar: {
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#0066CC",
    transition: "width 0.3s ease",
  },
  playControls: {
    marginBottom: "12px",
  },
  speedControl: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "12px",
  },
  speedLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#4a5568",
  },
  speedBtn: {
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#1a202c",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#4a5568",
  },
  detailValue: {
    fontFamily: "monospace",
    fontWeight: "600",
    color: "#0066CC",
  },
  summaryItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px",
    background: "#F0F9FF",
    borderRadius: "8px",
    marginBottom: "12px",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  summaryIcon: {
    fontSize: "18px",
    minWidth: "24px",
  },
};
