import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { API_BASE_URL } from "../config/api";

interface CoinContextType {
  total: number | null;
  increment: () => void;
  refresh: () => void;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export function CoinProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);

  const refresh = () => {
    fetch(`${API_BASE_URL}/api/completions/total`)
      .then((res) => res.json())
      .then((data) => setTotal(data.total))
      .catch((err) => console.error("Failed to fetch total completions:", err));
  };

  useEffect(() => {
    refresh();
  }, []);

  const increment = () => {
    setTotal((prev) => (prev === null ? 1 : prev + 1));
  };

  return (
    <CoinContext.Provider value={{ total, increment, refresh }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoin() {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error("useCoin must be used within a CoinProvider");
  }
  return context;
}
