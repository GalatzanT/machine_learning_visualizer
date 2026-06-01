export function HomePage({ setCurrentPage }) {
  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 ML Training Visualizer</h1>
        <p style={styles.subtitle}>
          Understanding Linear Regression Through Visualization
        </p>
      </div>

      {/* Algorithm Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Available Algorithms</h2>
        <p style={styles.sectionSubtitle}>
          Select an algorithm to get started
        </p>

        <div style={styles.grid}>
          {/* Linear Regression Card */}
          <div
            style={styles.card}
            onClick={() => setCurrentPage("training-linear")}
          >
            <div style={styles.cardIcon}>📈</div>
            <h3 style={styles.cardTitle}>Linear Regression</h3>
            <p style={styles.cardDescription}>
              Predict continuous values. Perfect for understanding regression
              through visualization.
            </p>
            <button style={styles.cardButton}>Learn More →</button>
          </div>

          {/* Logistic Regression Card */}
          <div
            style={styles.card}
            onClick={() => setCurrentPage("training-logistic")}
          >
            <div style={styles.cardIcon}>🎯</div>
            <h3 style={styles.cardTitle}>Logistic Regression</h3>
            <p style={styles.cardDescription}>
              Binary classification with sigmoid decision boundary and
              probability-based predictions.
            </p>
            <button style={styles.cardButton}>Learn More →</button>
          </div>

          {/* KNN Card */}
          <div
            style={styles.card}
            onClick={() => setCurrentPage("training-knn")}
          >
            <div style={styles.cardIcon}>🔍</div>
            <h3 style={styles.cardTitle}>K-Nearest Neighbors</h3>
            <p style={styles.cardDescription}>
              Instance-based learning. Classify by finding and voting with nearest neighbors.
            </p>
            <button style={styles.cardButton}>Learn More →</button>
          </div>

          {/* Decision Tree Card */}
          <div
            style={styles.card}
            onClick={() => setCurrentPage("decision-tree")}
          >
            <div style={styles.cardIcon}>🌳</div>
            <h3 style={styles.cardTitle}>Decision Tree</h3>
            <p style={styles.cardDescription}>
              Watch the tree grow split by split. See Gini impurity drop and information gain guide each decision.
            </p>
            <button style={styles.cardButton}>Learn More →</button>
          </div>

          {/* K-Means Card */}
          <div
            style={styles.card}
            onClick={() => setCurrentPage("kmeans")}
          >
            <div style={styles.cardIcon}>🎯</div>
            <h3 style={styles.cardTitle}>K-Means Clustering</h3>
            <p style={styles.cardDescription}>
              Unsupervised learning. Watch centroids move as the algorithm discovers natural groups in your data.
            </p>
            <button style={styles.cardButton}>Learn More →</button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>What You Can Do</h2>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>🎓</div>
            <h4 style={styles.infoTitle}>Learn</h4>
            <p style={styles.infoText}>
              Understand how machine learning algorithms work step-by-step
            </p>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>💾</div>
            <h4 style={styles.infoTitle}>Save</h4>
            <p style={styles.infoText}>
              Save trained models and view your training history
            </p>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>📊</div>
            <h4 style={styles.infoTitle}>Visualize</h4>
            <p style={styles.infoText}>
              See real-time visualizations of model training
            </p>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>⬇️</div>
            <h4 style={styles.infoTitle}>Download</h4>
            <p style={styles.infoText}>
              Export trained models as JSON for use anywhere
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 24px",
  },

  // Header
  header: {
    textAlign: "center",
    marginBottom: "80px",
  },
  title: {
    fontSize: "44px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#666",
    lineHeight: "1.6",
  },

  // Algorithm Section
  section: {
    marginBottom: "80px",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "8px",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginBottom: "40px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  cardIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "12px",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  cardButton: {
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
  comingSoon: {
    padding: "10px 24px",
    background: "#F0F9FF",
    color: "#0066CC",
    border: "1px solid #E0F2FE",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
  },

  // Info Section
  infoSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: "12px",
    padding: "60px 40px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "32px",
  },
  infoCard: {
    textAlign: "center",
  },
  infoIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "8px",
  },
  infoText: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
  },
};
