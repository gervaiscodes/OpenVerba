import { Skeleton } from "../Skeleton";

export function TextDetailSkeleton() {
  return (
    <div className="container">
      <div className="meta" style={{ marginBottom: "1.5rem" }}>
        <Skeleton width="80px" height="20px" />
        <span style={{ opacity: 0.3 }}>→</span>
        <Skeleton width="80px" height="20px" />
      </div>

      <div className="stepper">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            width="100%"
            height="36px"
            borderRadius="6px"
            style={{ flex: 1 }}
          />
        ))}
      </div>

      <div className="meta">
        <Skeleton width="120px" height="32px" borderRadius="6px" />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="sentence">
          <div className="tokens">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <Skeleton width="40px" height="14px" />
                <Skeleton width="50px" height="20px" />
              </div>
            ))}
          </div>
          <div className="sentence-text">
            <Skeleton width="90%" height="22px" />
            <Skeleton width="80%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  );
}
