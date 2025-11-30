import { useMemo } from "react";

interface CompletionStat {
  date: string;
  count: number;
}

interface CompletionGraphProps {
  stats: CompletionStat[];
}

export function CompletionGraph({ stats }: CompletionGraphProps) {
  // Get stats for the last 30 days
  const last30Days = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const stat = stats.find((s) => s.date === dateKey);
      days.push({
        date: dateKey,
        count: stat?.count || 0,
      });
    }

    return days;
  }, [stats]);

  const maxCount = Math.max(...last30Days.map((d) => d.count), 1);
  const barHeight = 120;

  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: "12px",
        padding: "1.5rem",
        border: "1px solid #27272a",
      }}
    >
      <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>
        Completion Trends (Last 30 Days)
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "0.25rem",
          height: `${barHeight + 40}px`,
        }}
      >
        {last30Days.map((day, idx) => {
          const height = maxCount > 0 ? (day.count / maxCount) * barHeight : 0;
          const date = new Date(day.date);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={day.date}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                minWidth: "0",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${barHeight}px`,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${height}px`,
                    background: day.count > 0 ? "#f97316" : isWeekend ? "#27272a" : "#1f1f23",
                    borderRadius: "2px 2px 0 0",
                    minHeight: day.count > 0 ? "2px" : "0",
                    transition: "all 0.2s ease",
                  }}
                  title={`${day.date}: ${day.count} completions`}
                />
              </div>
              {idx % 5 === 0 && (
                <span
                  style={{
                    fontSize: "0.625rem",
                    color: "#71717a",
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {date.getDate()}/{date.getMonth() + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "#71717a",
        }}
      >
        <span>Total: {stats.reduce((sum, s) => sum + s.count, 0)} completions</span>
        <span>Max per day: {maxCount}</span>
      </div>
    </div>
  );
}

