import { useState, useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModule } from "../../context/ModuleContext";
import {
  IconGrid,
  IconBuilding,
  IconUsers,
  IconMapPin,
  IconPackage,
  IconContact,
  IconSettings,
  IconUser,
  IconLogout,
  IconMenu,
  IconX,
  LogoMark,
  IconShoppingCart,
  IconCreditCard,
  IconTrendingUp,
  IconCalendar,
  IconBriefcase,
} from "../../assets/icons";

// ─── Icon mapping ─────────────────────────────────────────────────────────────

function getIconByName(iconName: string): ReactNode {
  const iconMap: Record<string, ReactNode> = {
    grid: <IconGrid />,
    "shopping-cart": <IconShoppingCart />,
    package: <IconPackage />,
    users: <IconUsers />,
    settings: <IconSettings />,
    "credit-card": <IconCreditCard />,
    "trending-up": <IconTrendingUp />,
    calendar: <IconCalendar />,
    briefcase: <IconBriefcase />,
    user: <IconUser />,
    building: <IconBuilding />,
    "map-pin": <IconMapPin />,
    contact: <IconContact />,
  };
  return iconMap[iconName] || <IconGrid />;
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: { label: string; path: string; icon: ReactNode };
  onClick?: () => void;
}

function SidebarNavItem({ item, onClick }: SidebarNavItemProps) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
          isActive
            ? "bg-(--accent-950) font-medium text-white"
            : "text-gray-500 hover:bg-gray-200 hover:text-gray-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={
              isActive
                ? "text-white"
                : "text-gray-400 group-hover:text-gray-600"
            }
          >
            {item.icon}
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({
  roleId,
  userEmail,
  roleName,
  onLogout,
  onNavClick,
}: {
  roleId: number;
  userEmail: string;
  roleName: string;
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  const { currentModule } = useModule();
  const initials = userEmail.slice(0, 2).toUpperCase();

  // Filter submodules based on roles if needed
  const mainItems = currentModule.submodules
    .filter((submod) => {
      if (currentModule.onlyRoles && !currentModule.onlyRoles.includes(roleId))
        return false;
      if (
        currentModule.excludeRoles &&
        currentModule.excludeRoles.includes(roleId)
      )
        return false;

      if (submod.onlyRoles && !submod.onlyRoles.includes(roleId)) return false;

      return true;
    })
    .map((submod) => ({
      label: submod.label,
      path: submod.path,
      icon: getIconByName(submod.icon),
    }));

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 mb-2">
        <div className="text-accent-600">
          <LogoMark size={28} />
        </div>
        <span className="font-bold text-gray-900 text-[15px] tracking-tight font-display">
          My Business Panel
        </span>
      </div>

      {/* Module indicator (for non-general modules) */}
      {currentModule.id !== "general" && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {currentModule.code} — {currentModule.label}
          </p>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => (
          <SidebarNavItem key={item.path} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-gray-100" />

      {/* Back to general (for non-general modules) */}
      {currentModule.id !== "general" && (
        <div className="px-3 space-y-0.5 mb-2">
          <NavLink
            to="/app/dashboard"
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-accent-50 text-accent-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? "text-accent-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                >
                  <IconGrid />
                </span>
                Ir a Módulos
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-600" />
                )}
              </>
            )}
          </NavLink>
        </div>
      )}

      {/* User section */}
      <div className="p-4 mt-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {userEmail}
            </p>
            <p className="text-xs text-gray-400 capitalize">{roleName}</p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const roleId = user?.role.role_id ?? 1;
  const roleName = user?.role.role_name ?? "usuario";
  const userEmail = user?.email ?? "";

  const sidebarProps = {
    roleId,
    userEmail,
    roleName,
    onLogout: handleLogout,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col bg-white border-r border-gray-300 h-full">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={[
          "fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Close button */}
        <button
          aria-label="close"
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <IconX />
        </button>
        <SidebarContent
          {...sidebarProps}
          onNavClick={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <button
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <IconMenu />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="text-accent-600">
              <LogoMark size={22} />
            </div>
            <span
              className="font-bold text-gray-900 text-sm"
              style={{ fontFamily: "var(--font-display)" }}
            >
              My Business Panel
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <IconLogout />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
