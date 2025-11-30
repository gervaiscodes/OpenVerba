import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { CompletionGraph } from "../components/CompletionGraph";

interface CompletionStat {
  date: string;
  count: number;
}

export default function Stats() {
  const [stats, setStats] = useState<CompletionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/completions/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => {
        setStats(data.stats || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch completion stats:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ color: "crimson" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">Statistics</h1>
      <CompletionGraph stats={stats} />
    </div>
  );
}

