import type { Segment } from "./Segment.interface";

export interface Margin {
  margin_id: string;
  tenant_id: string;
  segment_id: string;
  segment?: Segment;
  margin_percentage: number;
  created_at?: string;
  updated_at?: string;
}
