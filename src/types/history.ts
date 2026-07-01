import type { HttpMethod, ApiRequest } from './request';

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: number;
  status?: number;
  /** Full snapshot so the request can be reopened exactly as sent. */
  request: ApiRequest;
}
