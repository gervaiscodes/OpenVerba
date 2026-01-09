export function CoinIcon({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none"
      className={className}
    >
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-yellow-600"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" className="text-yellow-600" />
    </svg>
  );
}
