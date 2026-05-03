import { useState } from 'react';
import { loginUser } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export function LoginPage({ setCurrentPage }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      auth.login(response.user, response.access_token);
      setCurrentPage('training');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Login</h2>
        <p style={styles.subtitle}>Welcome back</p>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Password Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Remember Me Checkbox */}
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="remember" style={styles.checkboxLabel}>
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={styles.linkContainer}>
          <span style={styles.text}>Don't have an account? </span>
          <a
            onClick={() => setCurrentPage('register')}
            style={styles.link}
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    background: '#F8FAFC',
    paddingTop: '80px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    background: '#FFFFFF',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '48px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#0066CC',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4a5568',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '32px',
  },
  errorMessage: {
    color: '#FF6B6B',
    fontSize: '14px',
    padding: '12px',
    marginBottom: '20px',
    background: '#FFF5F5',
    borderRadius: '8px',
    border: '1px solid #FFE0E0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#1a202c',
    fontWeight: '600',
    fontSize: '14px',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    cursor: 'pointer',
    width: '18px',
    height: '18px',
    accentColor: '#0066CC',
  },
  checkboxLabel: {
    color: '#1a202c',
    fontSize: '14px',
    cursor: 'pointer',
  },
  button: {
    padding: '12px 24px',
    background: '#0066CC',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '16px',
  },
  text: {
    color: '#4a5568',
    fontSize: '14px',
  },
  link: {
    color: '#0066CC',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
