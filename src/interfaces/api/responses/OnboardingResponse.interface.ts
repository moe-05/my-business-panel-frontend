import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { Tenant } from "../../entities/Tenant.interface";

export interface OnboardingResponse {
  tenant: Tenant;
  branch: Branch;
  user: { user_id: string; email: string };
  subscription: {
    subscriptionId: string;
    clientSecret: string;
    invoice: string;
    status: string;
  };
}
