import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export function SavedSessionsPage({ setCurrentPage }) {
  const auth = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>Your Training Sessions</h1>

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
                <h3 style={styles.cardTitle}>{session.algorithm_type}</h3>
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
                  onClick={() => setCurrentPage("training")}
                  style={styles.viewButton}
                >
                  View
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
