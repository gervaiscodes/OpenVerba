import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

export function StreakCounter() {
  const [streak, setStreak] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/completions/streak`)
      .then((res) => res.json())
      .then((data) => setStreak(data.streak))
      .catch((err) => console.error("Failed to fetch streak:", err));
  }, []);

  if (streak === null) return null;

  const isActive = streak > 0;

  return (
    <div
      className="streak-counter"
      title={isActive ? `${streak} day streak!` : "No active streak"}
      onClick={() => navigate("/stats")}
      style={{
        cursor: "pointer",
      }}
    >
      <span className={`streak-flame${isActive ? " active" : ""}`}>
        🔥
      </span>
      <span className="streak-count">{streak}</span>
    </div>
  );
}
