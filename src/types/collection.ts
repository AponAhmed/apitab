import type { ApiRequest } from './request';

/**
 * A named group of saved requests. Requests are embedded (local-first) so a
 * collection is fully self-contained for export/import.
 */
export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
  createdAt: number;
  updatedAt: number;
}
