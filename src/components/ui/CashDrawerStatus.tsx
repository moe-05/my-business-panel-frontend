import { useDrawerAgentStatus } from "@/hooks/useDrawerAgentStatus";
import { Badge } from "@/components/ui/Badge";

export function CashDrawerStatus() {
  const status = useDrawerAgentStatus();

  if (status === "connected") {
    return <Badge variant="green">Cajon conectado</Badge>;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="red">Cajon desconectado</Badge>
      <a
        href="/drawer-agent.exe"
        download="drawer-agent.exe"
        className="inline-flex items-center gap-1 text-xs text-accent-700 underline underline-offset-2 hover:text-accent-900"
        title={
          "1. Descarga y ejecuta drawer-agent.exe\n" +
          "2. Crea un archivo .env junto al exe:\n" +
          "   PRINTER_INTERFACE=printer:<nombre-impresora>\n" +
          "   FRONTEND_ORIGIN=https://<tu-app>.vercel.app\n" +
          "3. Ejecuta el exe (doble click)\n" +
          "4. Para inicio automatico: copia el exe a shell:startup"
        }
      >
        Descargar agente
      </a>
    </div>
  );
}
