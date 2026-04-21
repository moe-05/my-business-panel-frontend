export interface HaciendaConfigUpdate {
  tenant_id: string;
  hacienda_username: string;
  hacienda_password: string;
  hacienda_client_id: string;
  p12_base64: string;
  p12_password: string;
}
