import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        Login to OpenVerba
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #3a3a3a",
              backgroundColor: "#1a1a1a",
              color: "#fff",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #3a3a3a",
              backgroundColor: "#1a1a1a",
              color: "#fff",
            }}
          />
        </div>
        {error && (
          <div
            style={{
              color: "#fb7185",
              marginBottom: "1rem",
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "#2a1a1a",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="badge badge-alt"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
        Don't have an account?{" "}
        <Link to="/signup" className="badge" style={{ marginLeft: "0.5rem" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
