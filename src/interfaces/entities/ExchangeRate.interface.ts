export interface ExchangeRate {
  exchange_rate_id: string;
  from_currency_id: number;
  to_currency_id: number;
  rate: string | number;
  effective_date: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  from_currency_code?: string;
  from_currency_name?: string;
  from_currency_symbol?: string;
  to_currency_code?: string;
  to_currency_name?: string;
  to_currency_symbol?: string;
}

export interface CreateExchangeRatePayload {
  from_currency_id: number;
  to_currency_id: number;
  rate: number;
  effective_date: string;
  source?: string;
}

export interface UpdateExchangeRatePayload {
  rate?: number;
  effective_date?: string;
  source?: string;
}
