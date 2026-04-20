/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { IOnboardingData } from "../api/types/auth";

const STORAGE_KEY = "mbp_onboarding";

const INITIAL_STATE: IOnboardingData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  docNumber: "",
  tenantName: "",
  contactPhone: "",
  identificationType: 1,
  identification: "",
  economicActivity: "",
  sign: "",
  regionId: null,
  branchName: "",
  branchNumber: "",
  branchAddress: "",
  haciendaUsername: "",
  haciendaPassword: "",
  haciendaClientId: "api-prod",
  p12Base64: "",
  p12Password: "",
  // tenantId: null,
  // branchId: null,
  userId: null,
};

interface OnboardingContextValue {
  data: IOnboardingData;
  setStep1: (
    values: Pick<
      IOnboardingData,
      "firstName" | "lastName" | "email" | "password" | "phone" | "docNumber"
    >,
  ) => void;
  setStep2: (
    values: Pick<
      IOnboardingData,
      | "tenantName"
      | "contactPhone"
      | "identificationType"
      | "identification"
      | "economicActivity"
      | "sign"
      | "regionId"
      | "branchName"
      | "branchNumber"
      | "branchAddress"
    >,
  ) => void;
  setStep3: (
    values: Pick<
      IOnboardingData,
      | "haciendaUsername"
      | "haciendaPassword"
      | "haciendaClientId"
      | "p12Base64"
      | "p12Password"
    >,
  ) => void;
  setCreatedIds: (ids: {
    tenantId: string;
    branchId: string;
    userId: string;
  }) => void;
  clear: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// TODO: re-enable sessionStorage persistence after testing
const PERSIST = false;

function loadStored(): IOnboardingData {
  if (!PERSIST) return INITIAL_STATE;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored
      ? {
          ...INITIAL_STATE,
          ...(JSON.parse(stored) as Partial<IOnboardingData>),
        }
      : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<IOnboardingData>(loadStored);

  const update = (patch: Partial<IOnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      if (PERSIST) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const setStep1: OnboardingContextValue["setStep1"] = (values) =>
    update(values);
  const setStep2: OnboardingContextValue["setStep2"] = (values) =>
    update(values);
  const setStep3: OnboardingContextValue["setStep3"] = (values) =>
    update(values);
  const setCreatedIds: OnboardingContextValue["setCreatedIds"] = (ids) =>
    update(ids);

  const clear = () => {
    if (PERSIST) sessionStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_STATE);
  };

  return (
    <OnboardingContext.Provider
      value={{ data, setStep1, setStep2, setStep3, setCreatedIds, clear }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
