import { useNavigate } from "react-router-dom";
import { useCurrentExchangeRate } from "@/hooks/useCurrentExchangeRate";

/** Indicador compacto de tasa USD -> VES vigente, para esquina superior
 *  derecha de las pantallas del modulo de Finanzas. Lleva a la pestana
 *  de tasa de cambio en Configuracion. */
export function FinanceRateBadge() {
  const rate = useCurrentExchangeRate();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/app/settings?tab=exchange_rate")}
      aria-label="Tasa de cambio USD a VES vigente"
      className="flex items-center cursor-pointer gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs font-medium text-gray-600 shrink-0"
    >
      {/* Version compacta en pantallas chicas ("$1 = ...") y completa desde sm. */}
      <span className="text-gray-400 sm:hidden">$1 =</span>
      <span className="hidden text-gray-400 sm:inline">USD → VES</span>
      <span className="font-semibold text-gray-900">
        {rate === null
          ? "—"
          : rate.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
        Bs.
      </span>
    </button>
  );
}
