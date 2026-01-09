import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { CompletionGraph } from "../components/CompletionGraph";
import { StatsSkeleton } from "../components/skeletons/StatsSkeleton";

interface CompletionStat {
  date: string;
  count: number;
}

export default function Stats() {
  const [stats, setStats] = useState<CompletionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/completions/stats`, {
      credentials: 'include',
    })
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
    return <StatsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
        <div style={{ color: "crimson" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <h1 className="mb-4 text-4xl font-extrabold text-center tracking-tight text-white sm:text-4xl text-2xl">Statistics</h1>
      <CompletionGraph stats={stats} />
    </div>
  );
}

