import { useStreak } from "../context/StreakContext";

export function StreakCounter() {
  const { streak } = useStreak();

  if (streak === null) return null;

  const isActive = streak > 0;

  return (
    <div
      className="streak-counter"
      title={isActive ? `${streak} day streak!` : "No active streak"}
    >
      <span className={`streak-flame${isActive ? " active" : ""}`}>
        🔥
      </span>
      <span className="streak-count">{streak}</span>
    </div>
  );
}
