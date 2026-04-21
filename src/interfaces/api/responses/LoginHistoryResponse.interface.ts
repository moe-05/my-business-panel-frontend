export interface LoginHistoryResponse {
  login_id: string;
  user_id: string;
  login_time: string;
  logout_time?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
}
