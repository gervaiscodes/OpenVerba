import { Skeleton } from "../Skeleton";

export function StatsSkeleton() {
  return (
    <div className="container">
      <Skeleton
        width="200px"
        height="40px"
        style={{ margin: "0 auto 2rem" }}
      />
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: "12px",
          padding: "2rem",
        }}
      >
        <Skeleton width="100%" height="300px" borderRadius="8px" />
      </div>
    </div>
  );
}
