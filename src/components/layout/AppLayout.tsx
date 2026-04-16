import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModule } from '../../context/ModuleContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M9 21V7l6-4v18M9 11h6M9 15h6M9 7h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconContact() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="14" y="3" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.5" />
      <rect x="2" y="13" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.5" />
      <rect x="14" y="13" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────

function getIconByName(iconName: string): ReactNode {
  const iconMap: Record<string, ReactNode> = {
    grid: <IconGrid />,
    'shopping-cart': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
    package: <IconPackage />,
    'file-text': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="13" x2="12" y2="17" /><line x1="9" y1="15" x2="15" y2="15" /></svg>,
    users: <IconUsers />,
    settings: <IconSettings />,
    'credit-card': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    'trending-up': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    user: <IconUser />,
    building: <IconBuilding />,
    'map-pin': <IconMapPin />,
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
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
          isActive
            ? 'bg-accent-50 text-accent-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-accent-600' : 'text-gray-400 group-hover:text-gray-600'}>
            {item.icon}
          </span>
          {item.label}
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-600" />
          )}
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
    .filter((item) => {
      if (currentModule.onlyRoles && !currentModule.onlyRoles.includes(roleId)) return false;
      if (currentModule.excludeRoles && currentModule.excludeRoles.includes(roleId)) return false;
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
        <span
          className="font-bold text-gray-900 text-[15px] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My Business Panel
        </span>
      </div>

      {/* Module indicator (for non-general modules) */}
      {currentModule.id !== 'general' && (
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
      {currentModule.id !== 'general' && (
        <div className="px-3 space-y-0.5 mb-2">
          <NavLink
            to="/app/dashboard"
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-accent-600' : 'text-gray-400 group-hover:text-gray-600'}>
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{userEmail}</p>
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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const roleId = user?.role.role_id ?? 1;
  const roleName = user?.role.role_name ?? 'usuario';
  const userEmail = user?.email ?? '';

  const sidebarProps = {
    roleId,
    userEmail,
    roleName,
    onLogout: handleLogout,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col bg-white border-r border-gray-100 h-full">
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
          'fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <IconX />
        </button>
        <SidebarContent {...sidebarProps} onNavClick={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <IconMenu />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="text-accent-600">
              <LogoMark size={22} />
            </div>
            <span className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
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
