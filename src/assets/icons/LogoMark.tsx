export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect
        x="14"
        y="3"
        width="8"
        height="8"
        rx="2"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="2"
        y="13"
        width="8"
        height="8"
        rx="2"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect x="14" y="13" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}
