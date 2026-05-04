import type {
  ButtonProps,
  Size,
  Variant,
} from "@/interfaces/components/ui/ButtonProps.interface";

const variantClasses: Record<Variant, string> = {
  primary: "btn-accent-primary hover:shadow-md",
  secondary: "btn-accent-secondary",
  ghost: "btn-accent-ghost",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
  dangerOutline:
    "bg-accent-white border-red-600 text-red-600 hover:bg-red-200 active:bg-red-300 disabled:bg-red-400",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-300",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-2 py-1 text-xs min-h-[28px]",
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-5 py-2.5 text-sm min-h-[44px]",
  lg: "px-7 py-3 text-base min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={[
        "inline-flex items-center border border-gray-300 justify-center gap-2 rounded-xl font-medium transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible-accent-outline",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
