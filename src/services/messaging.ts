import type { BodyType, RequestResult } from '@/types';

export const EXECUTE_REQUEST = 'apitab:execute-request' as const;

/** A form-data field, resolved to either a text value or file bytes. */
export interface WireFormDataField {
  key: string;
  value: string;
  fileName?: string;
  fileType?: string;
  /**
   * Base64-encoded file bytes (see utils/binary.ts). Deliberately not a raw
   * `ArrayBuffer` — despite looking structured-clone-safe, one empirically
   * does NOT survive `browser.runtime.sendMessage` here (arrives as an
   * empty object); base64 is JSON-safe by construction.
   */
  fileData?: string;
}

export interface WireFile {
  fileName: string;
  fileType: string;
  /** Base64-encoded file bytes — see WireFormDataField.fileData. */
  fileData: string;
}

/** Serializable HTTP request sent from a page to the background worker. */
export interface WireRequest {
  method: string;
  url: string;
  headers: [string, string][];
  bodyType: BodyType;
  body: string | null;
  formData?: WireFormDataField[];
  /** Whole-body file for the 'binary' body type. */
  binary?: WireFile;
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
