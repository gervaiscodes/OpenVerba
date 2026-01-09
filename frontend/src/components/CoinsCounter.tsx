import { useEffect, useState } from "react";
import { useCoin } from "../context/CoinContext";
import { CoinIcon } from "./icons/CoinIcon";

export function CoinsCounter() {
  const { total } = useCoin();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (total !== null) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [total]);

  if (total === null) return null;

  return (
    <div
      className="ml-2 flex items-center gap-1 text-sm font-semibold text-zinc-500 transition-all hover:text-zinc-200"
      title="Total words completed"
    >
      <CoinIcon
        size={16}
        className={`text-yellow-500 transition-transform duration-300 ${
          isAnimating ? "scale-125" : ""
        }`}
      />
      <span className="text-zinc-200">{total}</span>
    </div>
  );
}
