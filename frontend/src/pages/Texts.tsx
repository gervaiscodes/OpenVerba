import "../App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getLanguageName } from "../utils/languages";

type Text = {
  id: number;
  text: string;
  source_language: string;
  target_language: string;
  created_at: string;
};

export default function Texts() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/texts`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load texts");
        return r.json();
      })
      .then((json: Text[]) => {
        if (!cancelled) {
          setTexts(json);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container">
      <h1 className="title">All Texts</h1>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "crimson" }}>Error: {error}</div>}
      {!loading && !error && texts.length === 0 && (
        <div>No texts found.</div>
      )}
      {!loading && !error && texts.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {texts.map((t) => (
            <div
              key={t.id}
              className="sentence"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => navigate(`/texts/${t.id}`)}
            >
              <div className="meta" style={{ marginBottom: ".5rem" }}>
                <span className="badge badge-alt">{getLanguageName(t.source_language)}</span>
                <span>→</span>
                <span className="badge">{getLanguageName(t.target_language)}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: ".875rem",
                    opacity: 0.7,
                  }}
                >
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{t.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
