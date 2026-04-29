export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
}
