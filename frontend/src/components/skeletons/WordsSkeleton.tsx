import { Skeleton } from "../Skeleton";

export function WordsSkeleton() {
  return (
    <div className="container">
      <Skeleton
        width="120px"
        height="40px"
        style={{ margin: "0 auto 2rem" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {[1, 2].map((groupIndex) => (
          <div
            key={groupIndex}
            style={{
              background: "#0a0a0a",
              borderRadius: "12px",
              border: "1px solid #27272a",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#18181b",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #27272a",
              }}
            >
              <Skeleton width="150px" height="24px" />
            </div>
            <div>
              {[1, 2, 3].map((wordIndex) => (
                <div
                  key={wordIndex}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #27272a",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Skeleton
                      width="2rem"
                      height="2rem"
                      borderRadius="50%"
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <Skeleton width="120px" height="18px" />
                      <Skeleton width="100px" height="14px" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Skeleton width="90px" height="20px" borderRadius="6px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
