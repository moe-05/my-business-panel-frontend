import type { StatCardProps } from "@/interfaces/components/ui/StatCardProps.interface";

export function StatCard({
  label,
  value,
  icon,
  sublabel,
  accent = false,
}: StatCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 p-5 flex items-start gap-4 transition-shadow hover:shadow-md",
        accent
          ? "bg-accent-600 border-accent-600 text-white"
          : "bg-white border-gray-100 text-gray-900",
      ].join(" ")}
    >
      <div
        className={[
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          accent ? "bg-white/15" : "bg-accent-50",
        ].join(" ")}
      >
        <span className={accent ? "text-white" : "text-accent-600"}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-medium mb-0.5 ${accent ? "text-accent-200" : "text-gray-500"}`}
        >
          {label}
        </p>
        <p
          className={`font-display text-2xl font-bold leading-tight ${accent ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </p>
        {sublabel && (
          <p
            className={`text-xs mt-0.5 ${accent ? "text-accent-200" : "text-gray-400"}`}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
