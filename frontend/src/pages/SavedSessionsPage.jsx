import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export function SavedSessionsPage({ setCurrentPage }) {
  const auth = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [predictSession, setPredictSession] = useState(null);
  const [predictInput, setPredictInput] = useState('');
  const [predictResult, setPredictResult] = useState(null);
  const [predictError, setPredictError] = useState('');

  useEffect(() => {
    if (auth.token) {
      fetchSessions();
    }
  }, [auth.token]);

  const fetchSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/training-sessions",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/training-sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePredict = () => {
    if (!predictSession) return;
    
    setPredictError('');
    setPredictResult(null);
    
    try {
      const xValue = parseFloat(predictInput);
      if (isNaN(xValue)) {
        setPredictError('Please enter a valid number');
        return;
      }
      
      const algorithm = predictSession.algorithm_type.toLowerCase();
      let result;
      
      if (algorithm.includes('linear')) {
        const w = predictSession.model_parameters?.w || 0;
        const b = predictSession.model_parameters?.b || 0;
        result = w * xValue + b;
      } 
      else if (algorithm.includes('logistic')) {
        const w = predictSession.model_parameters?.w || 0;
        const b = predictSession.model_parameters?.b || 0;
        const z = w * xValue + b;
        result = 1 / (1 + Math.exp(-z));
      }
      else {
        setPredictError('Prediction not supported for this algorithm');
        return;
      }
      
      setPredictResult({
        x: xValue,
        y: result
      });
      
    } catch (err) {
      setPredictError('Error calculating prediction');
    }
  };

  const downloadModel = (session) => {
    try {
      // Generate JSON based on algorithm
      let modelJSON;

      if (session.algorithm_type === "Linear Regression") {
        modelJSON = {
          algorithm: "linear_regression",
          created_at: session.created_at,
          training_samples: session.metrics?.samples || 0,
          final_loss: session.metrics?.final_loss || 0,

          parameters: {
            w: session.model_parameters?.w || 0,
            b: session.model_parameters?.b || 0,
          },

          formula: "y = w*x + b",

          how_to_use: {
            step1: "Extract w and b from parameters",
            step2: "For new prediction: y = w*x + b",
            example: `y = ${session.model_parameters?.w || 0}*x + ${session.model_parameters?.b || 0}`,
          },
        };
      } else if (session.algorithm_type.toLowerCase().includes("logistic")) {
        modelJSON = {
          algorithm: "logistic_regression",
          created_at: session.created_at,
          training_samples: session.metrics?.samples || 0,
          final_loss: session.metrics?.final_loss || 0,

          parameters: {
            w: session.model_parameters?.w || 0,
            b: session.model_parameters?.b || 0,
          },

          formula: "sigmoid(w*x + b)",

          how_to_use: {
            step1: "Extract w and b from parameters",
            step2: "For new prediction: sigmoid(w*x + b)",
            note: "sigmoid(z) = 1 / (1 + e^(-z))",
          },
        };
      } else if (session.algorithm_type === "knn") {
        modelJSON = {
          algorithm: "knn",
          created_at: session.created_at,
          k: session.model_parameters?.k || 5,
          training_samples: session.metrics?.samples || 0,

          how_to_use: {
            step1: "KNN requires original training data",
            step2: "For new prediction: find k nearest neighbors",
            step3: "Use majority vote (classification) or average (regression)",
            note: "This file alone cannot make predictions - need original dataset",
          },
        };
      } else if (session.algorithm_type === "svm") {
        modelJSON = {
          algorithm: "svm",
          created_at: session.created_at,
          training_samples: session.metrics?.samples || 0,
          final_loss: session.metrics?.final_loss || 0,

          parameters: session.model_parameters || {},

          how_to_use: {
            note: "SVM model parameters stored. Implementation requires vector operations.",
          },
        };
      } else if (session.algorithm_type === "decision_tree") {
        modelJSON = {
          algorithm: "decision_tree",
          created_at: session.created_at,
          training_samples: session.metrics?.samples || 0,

          tree_structure: session.model_parameters?.tree || {},

          how_to_use: {
            step1:
              "Tree structure contains nodes with feature, threshold, predictions",
            step2: "For new prediction: traverse tree following feature values",
            step3: "Reach leaf node for final prediction",
          },
        };
      } else {
        modelJSON = {
          algorithm: session.algorithm_type,
          created_at: session.created_at,
          parameters: session.model_parameters || {},
          error: "Unknown algorithm type",
        };
      }

      // Create filename with timestamp
      const date = new Date();
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr =
        date.getHours().toString().padStart(2, "0") +
        date.getMinutes().toString().padStart(2, "0") +
        date.getSeconds().toString().padStart(2, "0"); // HHMMSS

      const filename = `${session.algorithm_type.replace(" ", "_")}_${dateStr}_${timeStr}.json`;

      // Create blob and download
      const blob = new Blob([JSON.stringify(modelJSON, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download model");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>Your Training Sessions</h1>
      
      <button
        onClick={() => setCurrentPage("compare")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          backgroundColor: "#667EEA",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        📊 Compare Two Sessions
      </button>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {loading && <div style={styles.loadingMessage}>Loading sessions...</div>}

      {!loading && sessions.length === 0 && (
        <div style={styles.emptyState}>
          <p>No saved sessions yet. Train a model and save it!</p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div style={styles.sessionGrid}>
          {sessions.map((session) => (
            <div key={session.id} style={styles.sessionCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{session.name || session.algorithm_type}</h3>
                <p style={{ fontSize: "12px", color: "#718096", margin: "4px 0 0 0" }}>
                  {session.algorithm_type}
                </p>
              </div>

              <div style={styles.cardContent}>
                <div style={styles.cardRow}>
                  <span style={styles.label}>Date:</span>
                  <span>{formatDate(session.created_at)}</span>
                </div>

                {session.metrics && session.metrics.final_loss && (
                  <div style={styles.cardRow}>
                    <span style={styles.label}>Final Loss:</span>
                    <span>{session.metrics.final_loss.toFixed(4)}</span>
                  </div>
                )}

                {session.metrics && session.metrics.accuracy && (
                  <div style={styles.cardRow}>
                    <span style={styles.label}>Accuracy:</span>
                    <span>{session.metrics.accuracy.toFixed(4)}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => {
                    setPredictSession(session);
                    setPredictInput('');
                    setPredictResult(null);
                    setPredictError('');
                  }}
                  style={styles.viewButton}
                >
                  Predict
                </button>
                <button
                  onClick={() => downloadModel(session)}
                  style={styles.downloadButton}
                >
                  Download
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {predictSession && (
        <div style={predictModalStyles.overlay} onClick={() => setPredictSession(null)}>
          <div style={predictModalStyles.content} onClick={(e) => e.stopPropagation()}>
            
            <h3 style={predictModalStyles.title}>Model Prediction</h3>
            
            {/* Model Info Section */}
            <div style={predictModalStyles.section}>
              <h4 style={predictModalStyles.sectionTitle}>Model Information</h4>
              <div style={predictModalStyles.infoRow}>
                <span>Algorithm:</span>
                <span style={predictModalStyles.infoValue}>{predictSession.algorithm_type}</span>
              </div>
              <div style={predictModalStyles.infoRow}>
                <span>Training Loss:</span>
                <span style={predictModalStyles.infoValue}>{(predictSession.metrics?.final_loss || 0).toFixed(6)}</span>
              </div>
              {predictSession.model_parameters && (
                <>
                  <div style={predictModalStyles.infoRow}>
                    <span>Weight (w):</span>
                    <span style={predictModalStyles.infoValue}>{predictSession.model_parameters.w?.toFixed(10)}</span>
                  </div>
                  <div style={predictModalStyles.infoRow}>
                    <span>Bias (b):</span>
                    <span style={predictModalStyles.infoValue}>{predictSession.model_parameters.b?.toFixed(10)}</span>
                  </div>
                  <div style={predictModalStyles.infoRow}>
                    <span>Formula:</span>
                    <span style={predictModalStyles.formula}>y = {predictSession.model_parameters.w?.toFixed(4)}·x + {predictSession.model_parameters.b?.toFixed(4)}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Prediction Input Section */}
            <div style={predictModalStyles.section}>
              <h4 style={predictModalStyles.sectionTitle}>Make Prediction</h4>
              <div style={predictModalStyles.inputGroup}>
                <label style={predictModalStyles.label}>Enter X value:</label>
                <input
                  type="number"
                  value={predictInput}
                  onChange={(e) => setPredictInput(e.target.value)}
                  placeholder="e.g., 5.5"
                  style={predictModalStyles.input}
                />
              </div>
              
              {predictError && (
                <div style={predictModalStyles.error}>{predictError}</div>
              )}
              
              {predictResult && (
                <div style={predictModalStyles.result}>
                  <div style={predictModalStyles.resultRow}>
                    <span>Input X:</span>
                    <span style={predictModalStyles.resultValue}>{predictResult.x}</span>
                  </div>
                  <div style={predictModalStyles.resultRow}>
                    <span>Predicted Y:</span>
                    <span style={predictModalStyles.resultValue}>{predictResult.y.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={predictModalStyles.footer}>
              <button
                onClick={() => setPredictSession(null)}
                style={predictModalStyles.closeButton}
              >
                Close
              </button>
              <button
                onClick={handlePredict}
                style={predictModalStyles.predictButton}
              >
                Predict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    background: "#F8FAFC",
    minHeight: "100vh",
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: "40px",
    textAlign: "center",
  },
  errorMessage: {
    color: "#FF6B6B",
    fontSize: "14px",
    padding: "12px 16px",
    background: "#FFF5F5",
    borderRadius: "8px",
    border: "1px solid #FFE0E0",
    marginBottom: "20px",
  },
  loadingMessage: {
    textAlign: "center",
    color: "#4a5568",
    fontSize: "16px",
    padding: "40px",
  },
  emptyState: {
    textAlign: "center",
    color: "#4a5568",
    fontSize: "16px",
    padding: "80px 20px",
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  sessionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  sessionCard: {
    background: "#FFFFFF",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  cardHeader: {
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0066CC",
    margin: "0",
  },
  cardContent: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#1a202c",
  },
  label: {
    fontWeight: "500",
    color: "#4a5568",
  },
  cardFooter: {
    display: "flex",
    gap: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
  },
  viewButton: {
    flex: 1,
    padding: "8px 16px",
    background: "#0066CC",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  downloadButton: {
    flex: 1,
    padding: "8px 16px",
    background: "#00A8E8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    flex: 1,
    padding: "8px 16px",
    background: "#FFFFFF",
    color: "#FF6B6B",
    border: "1px solid #FF6B6B",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

const predictModalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#4a5568',
  },
  infoValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#1a202c',
  },
  formula: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#0066CC',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: '#1a202c',
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  error: {
    color: '#FF6B6B',
    fontSize: '14px',
    padding: '12px',
    marginBottom: '16px',
    background: '#FFF5F5',
    borderRadius: '8px',
    border: '1px solid #FFE0E0',
  },
  result: {
    padding: '16px',
    background: '#F0F9FF',
    borderRadius: '8px',
    border: '1px solid #E0F2FE',
    marginBottom: '16px',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  },
  resultValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#0066CC',
    fontSize: '16px',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  closeButton: {
    padding: '10px 24px',
    background: '#FFFFFF',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  predictButton: {
    padding: '10px 24px',
    background: '#0066CC',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
