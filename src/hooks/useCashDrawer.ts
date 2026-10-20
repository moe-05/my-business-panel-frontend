const DRAWER_AGENT_URL = "http://localhost:9100/open-drawer";

export function useCashDrawer() {
  const openDrawer = (): void => {
    fetch(DRAWER_AGENT_URL, { method: "POST" }).catch(() => {});
  };

  return { openDrawer };
}
