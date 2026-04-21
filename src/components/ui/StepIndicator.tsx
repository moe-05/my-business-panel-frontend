export function StepIndicator({
  currentStep,
  labels,
}: {
  currentStep: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center mb-6">
      {labels.map((label, i) => {
        const step = i + 1;
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  isDone
                    ? "bg-gray-800 text-white"
                    : isActive
                      ? "bg-gray-800 text-white ring-4 ring-gray-200"
                      : "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {isDone ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium whitespace-nowrap",
                  isActive ? "text-gray-800" : "text-gray-400",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                  isDone ? "bg-gray-800" : "bg-gray-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
