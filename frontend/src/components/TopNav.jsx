import { useAuth } from '../hooks/useAuth';

export function TopNav({ setCurrentPage }) {
  const auth = useAuth();

  return (
    <nav className="topnav">
      <div className="topnav-logo">
        <span>🎓 ML Training Visualizer</span>
      </div>
      <div className="topnav-center">
        <span>Training</span>
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
                setCurrentPage('training');
              }}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={styles.buttonsContainer}>
            <button
              onClick={() => setCurrentPage('login')}
              style={styles.signInButton}
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentPage('register')}
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
  authContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  welcomeText: {
    fontSize: '14px',
    color: '#4a5568',
  },
  logoutButton: {
    background: '#FFFFFF',
    color: '#FF6B6B',
    border: '1px solid #FF6B6B',
    padding: '8px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  buttonsContainer: {
    display: 'flex',
    gap: '12px',
  },
  signInButton: {
    background: '#FFFFFF',
    color: '#0066CC',
    border: '1px solid #0066CC',
    padding: '8px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  signUpButton: {
    background: '#0066CC',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
};

