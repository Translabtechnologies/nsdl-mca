import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${BASE_URL}/keycloak/loginmca`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials. Please try again.");
      }

      const data = await response.json();

      // Store tokens
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);

      // if (rememberMe) {
      //   localStorage.setItem("remember_me", "true");
      // }

      // Call the login function from AuthContext
      await login(username, password);

      // Redirect to landing page
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.illustration}>
          <img
            src="/src/assets/login-illustration.png"
            alt=""
            style={{ maxWidth: "620px", width: "100%" }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            MCA <span style={{ color: "#FF9800" }}>PORTAL</span>
          </h1>
          <p style={styles.subtitle}>Login to your account</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username */}
            <div style={styles.field}>
              <label style={styles.label}>USERNAME *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                style={styles.input}
                onFocus={(e) =>
                  (e.currentTarget.style.borderBottom = "2px solid #FF9800")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderBottom = "1px solid #ccc")
                }
              />
            </div>

            {/* Password */}
            <div style={{ ...styles.field, position: "relative" }}>
              <label style={styles.label}>PASSWORD *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: "40px" }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderBottom = "2px solid #FF9800")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderBottom = "1px solid #ccc")
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "◎" : "⊘"}
              </button>
            </div>

            {/* Remember me + Forgot password */}
            {/* <div style={styles.row}>
              <label style={styles.rememberLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: "8px", accentColor: "#FF9800" }}
                />
                Remember me
              </label>
              <button type="button" style={styles.forgotBtn}>
                Forgot password?
              </button>
            </div> */}

            {/* Error */}
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.loginBtn,
                opacity: isLoading ? 0.75 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Logging in..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Roboto Flex', sans-serif",
    background: "#fff",
  },
  leftPanel: {
    flex: 1,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 48px",
    position: "relative",
  },
  illustration: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  rightPanel: {
    width: "480px",
    background: "linear-gradient(160deg, #FF9800 40%, #e65c00 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 32px",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
  },
  title: {
    fontFamily: "'Archivo', sans-serif",
    fontSize: "32px",
    fontWeight: 700,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#555",
    textAlign: "center",
    marginBottom: "32px",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#333",
    textTransform: "uppercase",
  },
  input: {
    border: "none",
    borderBottom: "1px solid #ccc",
    outline: "none",
    fontSize: "15px",
    padding: "10px 0",
    color: "#1A1A1A",
    background: "transparent",
    transition: "border-bottom 0.2s",
    width: "100%",
  },
  eyeBtn: {
    position: "absolute",
    right: "0",
    bottom: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
    lineHeight: 1,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberLabel: {
    fontSize: "14px",
    color: "#555",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  forgotBtn: {
    background: "none",
    border: "none",
    color: "#FF9800",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    padding: 0,
  },
  errorBox: {
    background: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#856404",
  },
  loginBtn: {
    background: "linear-gradient(90deg, #8B5000 0%, #FF9800 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    cursor: "pointer",
    marginTop: "8px",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 14px rgba(139,80,0,0.35)",
  },
};

export default Login;
