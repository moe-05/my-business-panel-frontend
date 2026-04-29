import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";

export interface SidebarNavItemData {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
  extra?: ReactNode;
  isActive?: boolean;
}

interface SidebarNavItemProps {
  item: SidebarNavItemData;
  onClick?: () => void;
}

export function SidebarNavItem({ item, onClick }: SidebarNavItemProps) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClick}
      className={({ isActive: navActive }) => {
        const isActive =
          item.isActive !== undefined ? item.isActive : navActive;
        return [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-(--accent-800) text-white"
            : "text-gray-500 hover:bg-gray-200 hover:text-gray-900",
        ].join(" ");
      }}
    >
      {({ isActive: navActive }) => {
        const isActive =
          item.isActive !== undefined ? item.isActive : navActive;
        return (
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
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.extra}
          </>
        );
      }}
    </NavLink>
  );
}
