import { useAuth } from "../hooks/useAuth";

export function TopNav({ setCurrentPage, currentPage }) {
  const auth = useAuth();

  return (
    <nav className="topnav">
      <div className="topnav-logo">
        <span>🎓 ML Training Visualizer</span>
      </div>
      <div className="topnav-center">
        <span
          onClick={() => setCurrentPage("home")}
          style={{
            ...styles.navLink,
            ...(currentPage === "home" ? styles.navLinkActive : {}),
          }}
        >
          Home
        </span>
        <span
          onClick={() => setCurrentPage("training-linear")}
          style={{
            ...styles.navLink,
            ...(currentPage === "training-linear" ? styles.navLinkActive : {}),
          }}
        >
          Linear Regression
        </span>
        {auth.token && (
          <span
            onClick={() => setCurrentPage("saved-sessions")}
            style={{
              ...styles.navLink,
              ...(currentPage === "saved-sessions"
                ? styles.navLinkActive
                : {}),
            }}
          >
            Saved Sessions
          </span>
        )}
      </div>
      <div className="topnav-right">
        {auth.token ? (
          <div style={styles.authContainer}>
            <span style={styles.welcomeText}>
              Welcome, {auth.user?.username}
            </span>
            <button
              onClick={() => {
                auth.logout();
                setCurrentPage("home");
              }}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={styles.buttonsContainer}>
            <button
              onClick={() => setCurrentPage("login")}
              style={styles.signInButton}
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentPage("register")}
              style={styles.signUpButton}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navLink: {
    cursor: "pointer",
    color: "#1a202c",
    fontSize: "15px",
    fontWeight: "500",
    padding: "0 0",
    paddingBottom: "0px",
    transition: "color 0.2s ease",
  },
  navLinkActive: {
    color: "#0066CC",
    borderBottom: "3px solid #0066CC",
    paddingBottom: "2px",
  },
  authContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  welcomeText: {
    fontSize: "14px",
    color: "#4a5568",
    fontWeight: "400",
  },
  logoutButton: {
    background: "#FFFFFF",
    color: "#FF6B6B",
    border: "1px solid #FF6B6B",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  buttonsContainer: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  signInButton: {
    background: "#FFFFFF",
    color: "#0066CC",
    border: "1px solid #0066CC",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  signUpButton: {
    background: "#0066CC",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
};
