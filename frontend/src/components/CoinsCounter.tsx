import { useEffect, useState } from "react";
import { useCoin } from "../context/CoinContext";

export function CoinsCounter() {
  const { total } = useCoin();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (total !== null) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [total]);

  if (total === null) return null;

  return (
    <div className="coins-counter" title="Total words completed" style={{ marginLeft: '1rem' }}>
      <span
        className="coins-icon"
        style={{
          display: 'inline-block',
          animation: isAnimating ? 'spin 1s ease-in-out' : 'none'
        }}
      >
        🪙
      </span>
      <span className="coins-count">{total}</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
