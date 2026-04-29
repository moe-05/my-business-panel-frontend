export interface HaciendaConfigUpdate {
  tenant_id: string;
  hacienda_username: string;
  hacienda_client_id: string;
  hacienda_password?: string;
  p12_base64?: string;
  p12_password?: string;
}
