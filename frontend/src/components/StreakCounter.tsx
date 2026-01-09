import { useStreak } from "../context/StreakContext";
import { FlameIcon } from "./icons/FlameIcon";

export function StreakCounter() {
  const { streak } = useStreak();

  if (streak === null) return null;

  const isActive = streak > 0;

  return (
    <div
      className="flex items-center gap-1 text-sm font-semibold transition-all"
      title={isActive ? `${streak} day streak!` : "No active streak"}
    >
      <FlameIcon
        size={16}
        className={`transition-all duration-300 ${
          isActive
            ? "text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]"
            : "text-zinc-600"
        }`}
      />
      <span className="text-zinc-200">{streak}</span>
    </div>
  );
}
