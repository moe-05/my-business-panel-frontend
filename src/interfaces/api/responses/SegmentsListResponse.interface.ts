import type { Segment } from "@/interfaces/entities/Segment.interface";

export interface SegmentsListResponse {
  segments: Segment[];
  total?: number;
}
