import { segmentApi } from "@/api/segment.api";

import type { Segment } from "@/interfaces/entities/Segment.interface";
import type { SegmentsListResponse } from "@/interfaces/api/responses/SegmentsListResponse.interface";

export const getAllSegments = async (): Promise<Segment[]> =>
  segmentApi.getAll();

export const getSegmentsList = async (): Promise<SegmentsListResponse> =>
  segmentApi.list();

export const getSegmentById = async (segmentId: string): Promise<Segment> =>
  segmentApi.getById(segmentId);
