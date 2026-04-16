import type { ReactNode } from "react";

export interface Step {
  number: number;
  label: string;
}

export interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep?: number;
  steps?: Step[];
  panelHeadline?: string;
  panelSubtext?: string;
}
