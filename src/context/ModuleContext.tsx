import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';
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

  // Update body data-module for CSS theme variables
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    let theme = 'dashboard';

    if (segments[0] === 'auth') {
      theme = 'auth';
    } else if (segments.length >= 2) {
      theme = segments[1];
    }

    document.body.dataset.module = theme;
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
