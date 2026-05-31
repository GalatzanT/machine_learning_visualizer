import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useKNN } from "../hooks/useKNN";
import { KNNScatterChart } from "../components/KNNScatterChart";
import "../index.css";

export function KNNPage() {
  const auth = useAuth();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [predictionInput, setPredictionInput] = useState("");

  const {
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
    handleReset,
  } = useKNN();

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
        algorithm_type: "K-Nearest Neighbors",
        dataset: formattedDataset,
        hyperparameters: { k },
        predictions: predictions,
        metrics: {
          k: k,
          samples: dataset.x.length,
          predictions_made: predictions.length,
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
          <h2>Load a dataset to start KNN training</h2>
          <p style={{ color: "#666" }}>
            K-Nearest Neighbors: Find k nearest training points and vote on the class
          </p>

          <div style={{ marginTop: "30px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={() => handleGenerateDataset("simple")}>Simple</button>
            <button className="btn-secondary" onClick={() => handleGenerateDataset("clusters")}>Clusters</button>
            <button className="btn-secondary" onClick={() => handleGenerateDataset("complex")}>Complex</button>
          </div>
        </div>
      )}

      {dataset && (
        <>
          <div style={styles.mainContent}>
            <div style={styles.leftPanel}>
              {/* Dataset Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📊 Dataset</h3>
                <p style={styles.cardText}>Binary classification data (Class 0 and 1)</p>
                <div style={styles.buttonColumn}>
                  <button className="btn-secondary" onClick={() => handleGenerateDataset("simple")}>Simple</button>
                  <button className="btn-secondary" onClick={() => handleGenerateDataset("clusters")}>Clusters</button>
                  <button className="btn-secondary" onClick={() => handleGenerateDataset("complex")}>Complex</button>
                </div>
              </div>

              {/* K Parameter Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎯 K Parameter</h3>
                <p style={styles.cardText}>Number of nearest neighbors to consider</p>
                <label style={styles.controlLabel}>k = {k}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={k}
                  onChange={(e) => handleChangeK(parseInt(e.target.value))}
                  style={{ ...styles.controlInput, width: "100%" }}
                />
                <p style={styles.paramInfo}>Higher k → smoother boundaries, more stable predictions</p>
              </div>

              {/* Predict Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>▶ Set the k Paramater</h3>
                {!trainingInfo ? (
                  <button onClick={handleStartTraining} style={styles.btnPrimary}>
                    Initialize KNN Model
                  </button>
                ) : (
                  <div>
                    <p style={styles.successText}>✓ {trainingInfo}</p>
                    <button
                      onClick={handleReset}
                      style={styles.btnSecondary}
                    >
                      🔄 Reset All
                    </button>
                  </div>
                )}
              </div>

              {/* Prediction Card */}
              {trainingInfo && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🔮 Test Prediction</h3>
                  <p style={styles.cardText}>Enter an X value to predict the class</p>
                  <div style={styles.inputGroup}>
                    <input
                      type="number"
                      placeholder="Enter X value"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(e.target.value)}
                      min={Math.min(...dataset.x).toFixed(1)}
                      max={Math.max(...dataset.x).toFixed(1)}
                      step="0.1"
                      style={styles.controlInput}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && predictionInput) {
                          handlePredictPoint(parseFloat(predictionInput));
                          setPredictionInput("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (predictionInput) {
                          handlePredictPoint(parseFloat(predictionInput));
                          setPredictionInput("");
                        }
                      }}
                      style={styles.btnPrimary}
                    >
                      Predict
                    </button>
                  </div>
                  <p style={styles.rangeInfo}>
                    Range: [{Math.min(...dataset.x).toFixed(2)}, {Math.max(...dataset.x).toFixed(2)}]
                  </p>
                </div>
              )}

              {/* Statistics Card */}
              {trainingInfo && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>📈 Statistics</h3>
                  <div style={styles.statLine}>
                    <span>K Parameter:</span>
                    <strong>{k}</strong>
                  </div>
                  <div style={styles.statLine}>
                    <span>Training Samples:</span>
                    <strong>{dataset.x.length}</strong>
                  </div>
                  <div style={styles.statLine}>
                    <span>Predictions Made:</span>
                    <strong>{predictions.length}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div style={styles.rightPanel}>
              {/* Info Bar */}
              {trainingInfo && (
                <div style={styles.infoBar}>
                  <strong>KNN Model:</strong> k={k}, {dataset.x.length} training samples
                </div>
              )}

              {/* Decision Boundary Chart */}
              {dataset && (
                <div style={styles.card}>
                  <KNNScatterChart
                    dataset={dataset}
                    decisionBoundary={decisionBoundary}
                    currentPrediction={currentPrediction}
                    predictions={predictions}
                  />
                </div>
              )}

              {/* Current Prediction Details */}
              {currentPrediction && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>👥 K-Nearest Neighbors Details</h3>
                  
                  <div style={styles.predictionBox}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Test Point X:</span>
                      <span style={styles.detailValue}>{currentPrediction.x.toFixed(4)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Predicted Class:</span>
                      <span style={{
                        ...styles.detailValue,
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: currentPrediction.prediction === 0 ? "#4299E1" : "#F56565"
                      }}>
                        {currentPrediction.prediction}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>K Parameter:</span>
                      <span style={styles.detailValue}>{currentPrediction.k}</span>
                    </div>
                  </div>

                  <h4 style={styles.neighborTitle}>Nearest Neighbors (sorted by distance):</h4>
                  <div style={styles.neighborsList}>
                    {currentPrediction.neighbor_distances.map((dist, idx) => (
                      <div key={idx} style={styles.neighborRow}>
                        <span style={styles.neighborIndex}>#{idx + 1}</span>
                        <span style={{
                          ...styles.neighborClass,
                          color: currentPrediction.neighbors[idx] === 0 ? "#4299E1" : "#F56565"
                        }}>
                          Class {currentPrediction.neighbors[idx]}
                        </span>
                        <span style={styles.neighborDistance}>
                          Distance: {dist.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h4 style={styles.neighborTitle}>Vote Result:</h4>
                  <div style={styles.voteBox}>
                    {Object.entries(currentPrediction.votes).map(([cls, count]) => (
                      <div key={cls} style={styles.voteItem}>
                        <span style={styles.voteClass}>Class {cls}:</span>
                        <span style={styles.voteCount}>{count} vote{count !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>

                  <p style={styles.explanation}>{currentPrediction.explanation}</p>
                </div>
              )}
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
            <h3 style={styles.modalTitle}>Save KNN Session</h3>

            {saveError && <div style={styles.errorMessage}>{saveError}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Session Name (Optional)</label>
              <input
                type="text"
                placeholder="KNN Training Session"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={handleSaveSession}
                disabled={saving}
                style={styles.btnPrimary}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={styles.btnSecondary}
              >
                Cancel
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
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    padding: "20px",
    maxWidth: "1600px",
    margin: "0 auto",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#2d3748",
  },
  cardText: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#718096",
  },
  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  controlLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#2d3748",
    marginBottom: "8px",
  },
  controlInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    fontSize: "14px",
  },
  paramInfo: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#718096",
    fontStyle: "italic",
  },
  btnPrimary: {
    padding: "10px 16px",
    backgroundColor: "#0066CC",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 16px",
    backgroundColor: "#e2e8f0",
    color: "#2d3748",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
  },
  rangeInfo: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#718096",
  },
  statLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #edf2f7",
    fontSize: "14px",
  },
  successText: {
    color: "#22863a",
    backgroundColor: "#f0f9f4",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "12px",
  },
  infoBar: {
    backgroundColor: "#f7fafc",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    padding: "12px",
    fontSize: "13px",
    color: "#4a5568",
  },
  predictionBox: {
    backgroundColor: "#f7fafc",
    padding: "16px",
    borderRadius: "4px",
    marginBottom: "16px",
    borderLeft: "4px solid #0066CC",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "14px",
  },
  detailLabel: {
    color: "#718096",
    fontWeight: "500",
  },
  detailValue: {
    color: "#2d3748",
    fontWeight: "600",
  },
  neighborTitle: {
    marginTop: "16px",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
  },
  neighborsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  neighborRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    backgroundColor: "#f7fafc",
    borderRadius: "4px",
    fontSize: "13px",
  },
  neighborIndex: {
    fontWeight: "600",
    color: "#718096",
    minWidth: "30px",
  },
  neighborClass: {
    fontWeight: "600",
    minWidth: "60px",
  },
  neighborDistance: {
    marginLeft: "auto",
    color: "#718096",
  },
  voteBox: {
    backgroundColor: "#f7fafc",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "12px",
  },
  voteItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: "14px",
  },
  voteClass: {
    fontWeight: "600",
    color: "#2d3748",
  },
  voteCount: {
    color: "#4a5568",
  },
  explanation: {
    backgroundColor: "#f0f9f4",
    color: "#22863a",
    padding: "12px",
    borderRadius: "4px",
    fontSize: "13px",
    marginTop: "12px",
  },
  saveButtonContainer: {
    textAlign: "center",
    padding: "20px",
  },
  saveButton: {
    padding: "12px 24px",
    backgroundColor: "#27AE60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "400px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  modalTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "13px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#2d3748",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
  },
};
