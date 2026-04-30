import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconContact,
  IconCreditCard,
  IconGrid,
  IconLogout,
  IconMapPin,
  IconPackage,
  IconSettings,
  IconShield,
  IconShoppingCart,
  IconTrendingUp,
  IconUser,
  IconUsers,
  LogoMark,
  IconChevronRight,
} from "@/assets/icons";
import { MODULES, isAllowedForRole } from "@/config/modules";
import { useModule } from "@/context/ModuleContext";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";

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
    shield: <IconShield />,
  };

  return iconMap[iconName] || <IconGrid />;
}

interface SidebarContentProps {
  roleId: number;
  userEmail: string;
  roleName: string;
  onLogout: () => void;
  onNavClick?: () => void;
}

export function SidebarContent({
  roleId,
  userEmail,
  roleName,
  onLogout,
  onNavClick,
}: SidebarContentProps) {
  const navigate = useNavigate();
  const { currentModule, currentModuleId } = useModule();
  const [isModulesExpanded, setIsModulesExpanded] = useState(true);
  const initials = userEmail.slice(0, 2).toUpperCase();

  const handleLogoClick = () => {
    const generalModule = Object.values(MODULES).find(
      (module) => module.id === "general",
    );
    if (generalModule) {
      navigate(generalModule.path);
      onNavClick?.();
    }
  };

  const visibleModules = Object.values(MODULES).filter((module) =>
    isAllowedForRole(module.rolesAllowed, roleId),
  );

  const mainItems = currentModule.submodules
    .filter((submodule) => isAllowedForRole(submodule.rolesAllowed, roleId))
    .map((submodule) => ({
      label: submodule.label,
      path: submodule.path,
      icon: getIconByName(submodule.icon),
      end: submodule.end,
    }));

  return (
    <div className="flex h-full flex-col">
      <div
        onClick={handleLogoClick}
        className="mb-2 flex items-center gap-2.5 px-4 py-5 cursor-pointer rounded-lg transition-colors hover:bg-gray-100"
      >
        <div className="text-accent-600">
          <LogoMark size={28} />
        </div>
        <span className="font-display text-[15px] font-bold tracking-tight text-gray-900">
          My Business Panel
        </span>
      </div>

      <div className="mx-3 my-4 rounded-2xl border border-gray-200 bg-gray-50/90 p-2">
        <button
          onClick={() => setIsModulesExpanded(!isModulesExpanded)}
          className="flex cursor-pointer w-full items-center justify-between px-2 py-2 text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Módulos
          </p>
          <span
            className={[
              "text-gray-400 transition-transform duration-200",
              isModulesExpanded ? "rotate-90" : "",
            ].join(" ")}
          >
            <IconChevronRight width={14} />
          </span>
        </button>
        <div
          className={[
            "space-y-1 overflow-hidden transition-all duration-200",
            isModulesExpanded
              ? "mt-1 max-h-96 opacity-100"
              : "max-h-0 opacity-0",
          ].join(" ")}
        >
          {visibleModules.map((module) => {
            const isActive = currentModuleId === module.id;

            return (
              <SidebarNavItem
                key={module.id}
                item={{
                  label: module.label,
                  path: module.path,
                  icon: getIconByName(module.icon),
                  end: module.id === "general",
                  isActive: isActive,
                }}
                onClick={onNavClick}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-3 rounded-2xl border border-gray-200 bg-gray-50/90 px-3 py-4">
          <nav className="flex-1 space-y-0.5 px-3">
            {mainItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                onClick={onNavClick}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-800">
              {userEmail}
            </p>
            <p className="text-xs capitalize text-gray-400">{roleName}</p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesion"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );
}
