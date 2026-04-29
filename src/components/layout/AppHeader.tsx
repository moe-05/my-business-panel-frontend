import { IconLogout, IconMenu, LogoMark } from "@/assets/icons";

interface AppHeaderProps {
  onMenuOpen: () => void;
  onLogout: () => void;
}

export function AppHeader({ onMenuOpen, onLogout }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 lg:hidden">
      <button
        aria-label="menu"
        onClick={onMenuOpen}
        className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <IconMenu />
      </button>
      <div className="flex flex-1 items-center gap-2">
        <div className="text-accent-600">
          <LogoMark size={22} />
        </div>
        <span className="text-sm font-bold text-gray-900">
          My Business Panel
        </span>
      </div>
      <button
        onClick={onLogout}
        title="Cerrar sesion"
        className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <IconLogout />
      </button>
    </header>
  );
}
