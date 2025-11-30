export function PlayIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
    >
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  );
}
