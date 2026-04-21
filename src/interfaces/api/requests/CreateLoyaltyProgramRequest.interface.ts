export interface CreateLoyaltyProgramRequest {
  tenant_id: string;
  points_earned_per_currency_unit: number;
  points_redeemed_per_currency_unit: number;
  minimum_purchase_for_points?: number;
}
