import { Skeleton } from "../Skeleton";

export function TextListSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="sentence"
          style={{ textAlign: "left" }}
        >
          <div className="meta" style={{ marginBottom: ".5rem" }}>
            <Skeleton width="80px" height="20px" />
            <span style={{ opacity: 0.3 }}>→</span>
            <Skeleton width="80px" height="20px" />
            <span style={{ marginLeft: "auto" }}>
              <Skeleton width="100px" height="16px" />
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Skeleton width="100%" height="20px" />
            <Skeleton width="80%" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
}
