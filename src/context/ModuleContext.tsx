import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULES, type ModuleId, type Module } from '../config/modules';

interface ModuleContextValue {
  currentModuleId: ModuleId;
  currentModule: Module;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

function resolveModuleFromPath(pathname: string): ModuleId {
  const segments = pathname.split('/').filter(Boolean);

  // /app/pos/... → pos
  // /app/int/... → int
  // /app/sch/... → sch
  // /app/hr/... → hr
  // /app/fnz/... → fnz
  // /app/dashboard, /app/users, /app/tenants, /app/profile → general

  if (segments.length < 2) return 'general';

  const possibleModule = segments[1];

  if (['pos', 'int', 'sch', 'hr', 'fnz'].includes(possibleModule)) {
    return possibleModule as ModuleId;
  }

  return 'general';
}

export function ModuleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const value = useMemo(() => {
    const currentModuleId = resolveModuleFromPath(location.pathname);
    const currentModule = MODULES[currentModuleId];

    return {
      currentModuleId,
      currentModule,
    };
  }, [location.pathname]);

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModule must be used inside ModuleProvider');
  return ctx;
}
