import type { IconComponentProps } from "./icon.types";

export function IconChevronRight({
  width,
  height,
  ...props
}: IconComponentProps) {
  const size = width || height || 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
