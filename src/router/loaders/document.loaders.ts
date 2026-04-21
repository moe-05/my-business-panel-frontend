import { documentApi } from "@/api/document.api";

import type { DocumentType } from "@/interfaces/entities/DocumentType.interface";
import type { DocumentTypesResponse } from "@/interfaces/api/responses/DocumentTypesResponse.interface";

export const getDocumentTypes = async (): Promise<DocumentType[]> =>
  documentApi.getAll();

export const getDocumentTypesList = async (): Promise<DocumentTypesResponse> =>
  documentApi.list();
