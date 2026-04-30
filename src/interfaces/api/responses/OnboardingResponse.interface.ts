import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { Tenant } from "../../entities/Tenant.interface";

export interface OnboardingResponse {
  tenant: Tenant;
  branch: Branch;
  user: { user_id: string; email: string };
  subscription: {
    /** Null cuando el onboarding usó un special_code en vez de Stripe. */
    subscriptionId: string | null;
    clientSecret: string | null;
    invoice: string | null;
    /**
     * Status de Stripe ("incomplete", "active", ...) o el literal
     * `"special_code"` cuando se canjeó un código y no hubo cargo.
     */
    status: string | null;
    /** TRUE cuando el onboarding consumió un código especial. */
    usingSpecialCode?: boolean;
  };
}
