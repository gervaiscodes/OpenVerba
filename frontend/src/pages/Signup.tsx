import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6" style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        Sign up for OpenVerba
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
            Password (minimum 8 characters)
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
          className="inline-flex items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-sm font-semibold uppercase tracking-wide text-white"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200" style={{ marginLeft: "0.5rem" }}>
          Login
        </Link>
      </p>
    </div>
  );
}
