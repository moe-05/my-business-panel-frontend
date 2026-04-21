import { segmentApi } from "@/api/segment.api";

import type { Segment } from "@/interfaces/entities/Segment.interface";

export const createSegment = async (data: Partial<Segment>): Promise<Segment> =>
  segmentApi.create(data);

export const updateSegment = async (
  segmentId: string,
  data: Partial<Segment>,
): Promise<Segment> => segmentApi.update(segmentId, data);

export const deleteSegment = async (
  segmentId: string,
): Promise<{ message: string }> => segmentApi.delete(segmentId);
