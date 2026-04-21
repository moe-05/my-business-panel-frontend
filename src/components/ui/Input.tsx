import type { InputProps } from "@/interfaces/components/ui/InputProps.interface";
import { IconEye } from "@/assets/icons/IconEye";
import { IconEyeOff } from "@/assets/icons/IconEyeOff";
import { forwardRef, useState } from "react";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      className = "",
      type,
      leftAddon,
      leftAddonClassName = "",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const hasLeftAddon = leftAddon !== undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {!props.required && (
              <span className="ml-1 text-xs font-normal text-gray-400">
                (opcional)
              </span>
            )}
          </label>
        )}
        <div className={hasLeftAddon ? "flex gap-2 items-start" : ""}>
          {hasLeftAddon && (
            <div
              className={[
                "flex items-center px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium whitespace-nowrap shrink-0",
                leftAddonClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {leftAddon}
            </div>
          )}

          <div className={hasLeftAddon ? "flex-1" : ""}>
            <div className="relative">
              <input
                ref={ref}
                type={inputType}
                className={[
                  "w-full rounded-xl border border-gray-300 bg-accent-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
                  "transition-all duration-150 outline-none",
                  "focus-ring-accent",
                  error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 hover:border-gray-300",
                  isPassword ? "pr-11" : "",
                  className,
                ]
                  .filter(Boolean)
                  .join(" ")}
                {...props}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              )}
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
