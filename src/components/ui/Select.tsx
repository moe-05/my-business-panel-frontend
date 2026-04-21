import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className = "",
      value,
      defaultValue,
      onChange,
      disabled,
      name,
      required,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const buttonId = useId();
    const listboxId = useId();

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(
      defaultValue !== undefined ? String(defaultValue) : "",
    );
    const [isOpen, setIsOpen] = useState(false);

    const selectedValue = isControlled ? String(value ?? "") : internalValue;

    const selectedOption = useMemo(
      () => options.find((option) => String(option.value) === selectedValue),
      [options, selectedValue],
    );

    useEffect(() => {
      if (!isOpen) return;

      const handleOutsideClick = (event: MouseEvent) => {
        if (!wrapperRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      return () =>
        document.removeEventListener("mousedown", handleOutsideClick);
    }, [isOpen]);

    const assignRef = (node: HTMLSelectElement | null) => {
      selectRef.current = node;

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    };

    const triggerNativeChange = (nextValue: string) => {
      if (!selectRef.current) return;

      selectRef.current.value = nextValue;
      const changeEvent = new Event("change", { bubbles: true });
      selectRef.current.dispatchEvent(changeEvent);
    };

    const handleSelect = (nextValue: string) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      triggerNativeChange(nextValue);
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);

        const currentIndex = options.findIndex(
          (option) => String(option.value) === selectedValue,
        );
        const nextIndex =
          currentIndex >= 0 && currentIndex < options.length - 1
            ? currentIndex + 1
            : 0;
        handleSelect(String(options[nextIndex].value));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);

        const currentIndex = options.findIndex(
          (option) => String(option.value) === selectedValue,
        );
        const nextIndex =
          currentIndex > 0 ? currentIndex - 1 : Math.max(options.length - 1, 0);
        if (options[nextIndex]) {
          handleSelect(String(options[nextIndex].value));
        }
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    return (
      <div className="flex flex-col gap-1.5" ref={wrapperRef}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-accent-500">*</span>}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            id={buttonId}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            onBlur={
              onBlur as
                | undefined
                | ((event: React.FocusEvent<HTMLButtonElement>) => void)
            }
            className={[
              "w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-left",
              "transition-all duration-150 outline-none",
              "focus-ring-accent",
              disabled
                ? "cursor-not-allowed bg-gray-50 text-gray-400"
                : "cursor-pointer",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 hover:border-gray-300 text-gray-900",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className={selectedOption ? "text-gray-900" : "text-gray-400"}
            >
              {selectedOption?.label || placeholder || "Seleccionar"}
            </span>
          </button>

          {isOpen && !disabled && (
            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={buttonId}
              className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            >
              {options.map((opt) => {
                const optionValue = String(opt.value);
                const isSelected = optionValue === selectedValue;

                return (
                  <li key={opt.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      onClick={() => handleSelect(optionValue)}
                      className={[
                        "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-(--accent-950) font-medium text-white"
                          : "text-gray-700 hover:bg-(--accent-950) hover:text-white",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <select
            ref={assignRef}
            value={selectedValue}
            onChange={onChange}
            name={name}
            required={required}
            disabled={disabled}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
