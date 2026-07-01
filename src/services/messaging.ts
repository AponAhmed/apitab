import type { BodyType, RequestResult } from '@/types';

export const EXECUTE_REQUEST = 'apitab:execute-request' as const;

/** Serializable HTTP request sent from a page to the background worker. */
export interface WireRequest {
  method: string;
  url: string;
  headers: [string, string][];
  bodyType: BodyType;
  body: string | null;
  formData?: { key: string; value: string }[];
  timeoutMs: number;
}

export interface ExecuteRequestMessage {
  type: typeof EXECUTE_REQUEST;
  payload: WireRequest;
}

export type RuntimeMessage = ExecuteRequestMessage;

/** Sends an HTTP request to the background worker and awaits the result. */
export async function sendExecuteRequest(payload: WireRequest): Promise<RequestResult> {
  const message: ExecuteRequestMessage = { type: EXECUTE_REQUEST, payload };
  return (await browser.runtime.sendMessage(message)) as RequestResult;
}
