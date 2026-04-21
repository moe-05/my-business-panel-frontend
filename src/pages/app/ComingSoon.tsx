export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 lg:p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-gray-700"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1 font-display">
          {title}
        </h2>
        <p className="text-sm text-gray-400">
          Este módulo estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}
