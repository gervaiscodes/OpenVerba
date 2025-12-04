import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { API_BASE_URL } from "../config/api";

interface StreakContextType {
  streak: number | null;
  refreshStreak: () => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [streak, setStreak] = useState<number | null>(null);

  const fetchStreak = () => {
    fetch(`${API_BASE_URL}/api/completions/streak`)
      .then((res) => res.json())
      .then((data) => setStreak(data.streak))
      .catch((err) => console.error("Failed to fetch streak:", err));
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return (
    <StreakContext.Provider value={{ streak, refreshStreak: fetchStreak }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error("useStreak must be used within a StreakProvider");
  }
  return context;
}
