import { ONBOARDING_STEPS } from "../../constants/onboarding-steps";
import type { OnboardingLayoutProps } from "../../interfaces/components/layout/OnboardingLayoutProps";

export function OnboardingLayout({
  children,
  currentStep,
  steps = ONBOARDING_STEPS,
  panelHeadline,
  panelSubtext,
}: OnboardingLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Panel izquierdo decorativo ── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gray-950">
        {/* Fondo con gradiente y textura */}
        <div className="absolute inset-0 bg-gradient-dark" />

        {/* Orbes decorativos */}
        <div className="absolute -top-20 -right-20 w-75 h-75 rounded-full bg-gray-700/20 blur-3xl" />
        <div className="absolute -bottom-15 -left-15 w-62 h-62 rounded-full bg-gray-600/10 blur-3xl" />

        {/* Contenido del panel */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="8" height="8" rx="2" fill="white" />
                <rect
                  x="14"
                  y="3"
                  width="8"
                  height="8"
                  rx="2"
                  fill="white"
                  fillOpacity="0.6"
                />
                <rect
                  x="2"
                  y="13"
                  width="8"
                  height="8"
                  rx="2"
                  fill="white"
                  fillOpacity="0.6"
                />
                <rect x="14" y="13" width="8" height="8" rx="2" fill="white" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight font-display">
              My Business Panel{" "}
              {import.meta.env.VITE_ENV === "production"
                ? ""
                : `(env: ${import.meta.env.VITE_ENV})`}
            </span>
          </div>

          {/* Headline */}
          {panelHeadline && (
            <div className="mb-8">
              <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3 font-display">
                {panelHeadline}
              </h1>
              {panelSubtext && (
                <p className="text-gray-300 text-base leading-relaxed">
                  {panelSubtext}
                </p>
              )}
            </div>
          )}

          {/* Step indicator */}
          {currentStep !== undefined && (
            <div className="space-y-3">
              {steps.map((step) => {
                const isDone = step.number < currentStep;
                const isActive = step.number === currentStep;
                return (
                  <div key={step.number} className="flex items-center gap-3">
                    <div
                      className={[
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                        isDone
                          ? "bg-white text-gray-900"
                          : isActive
                            ? "bg-gray-400 text-white ring-2 ring-gray-300/50 ring-offset-1 ring-offset-transparent"
                            : "bg-white/10 text-white/40",
                      ].join(" ")}
                    >
                      {isDone ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={[
                        "text-sm font-medium transition-colors",
                        isActive
                          ? "text-white"
                          : isDone
                            ? "text-gray-300"
                            : "text-white/40",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Panel derecho – formulario ── */}
      <main className="flex-1 min-h-0 flex flex-col bg-white overflow-y-auto">
        {/* Header móvil (solo visible en <lg) */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="8" height="8" rx="2" fill="white" />
              <rect
                x="14"
                y="3"
                width="8"
                height="8"
                rx="2"
                fill="white"
                fillOpacity="0.6"
              />
              <rect
                x="2"
                y="13"
                width="8"
                height="8"
                rx="2"
                fill="white"
                fillOpacity="0.6"
              />
              <rect x="14" y="13" width="8" height="8" rx="2" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-base font-display">
            My Business Panel
          </span>
        </div>

        {/* Contenido del formulario */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
