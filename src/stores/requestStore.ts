import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createRequest, emptyKeyValue } from '@/utils/defaults';
import { formatJson } from '@/utils/json';
import { paramsFromUrl, urlWithParams } from '@/utils/query';
import { uuid } from '@/utils/id';
import { executeRequest } from '@/services/requestService';
import { parseCurl, type ParseCurlResult } from '@/utils/curl';
import { browserLocalStorage } from './persist';
import { useEnvironmentStore } from './environmentStore';
import { useSettingsStore } from './settingsStore';
import { useHistoryStore } from './historyStore';
import { useCollectionStore } from './collectionStore';
import type {
  ApiRequest,
  ApiResponse,
  ApiError,
  AuthType,
  BodyType,
  HttpMethod,
  KeyValue,
  SavedRequestRef,
} from '@/types';

export type RequestTab = 'params' | 'headers' | 'auth' | 'body';
export type ResponseTab = 'body' | 'headers' | 'curl' | 'code';

/** Ensures a key/value list always ends with one blank row for quick entry. */
function withTrailingRow(rows: KeyValue[]): KeyValue[] {
  const last = rows[rows.length - 1];
  if (!last || last.key !== '' || last.value !== '') return [...rows, emptyKeyValue()];
  return rows;
}

/** Backfills defaults + trailing rows so any request is safe to edit/render. */
function normalizeForEditing(req: ApiRequest): ApiRequest {
  const base = createRequest();
  const merged: ApiRequest = {
    ...base,
    ...req,
    auth: {
      type: req.auth?.type ?? 'none',
      bearer: { ...base.auth.bearer, ...req.auth?.bearer },
      basic: { ...base.auth.basic, ...req.auth?.basic },
      apiKey: { ...base.auth.apiKey, ...req.auth?.apiKey },
    },
    body: {
      ...base.body,
      ...req.body,
      formUrlEncoded: withTrailingRow(req.body?.formUrlEncoded ?? []),
      formData: withTrailingRow(req.body?.formData ?? []),
    },
    params: withTrailingRow(req.params ?? []),
    headers: withTrailingRow(req.headers ?? []),
  };
  return merged;
}

interface RequestState {
  request: ApiRequest;
  response: ApiResponse | null;
  error: ApiError | null;
  isLoading: boolean;
  sentAt: number | null;
  savedRef: SavedRequestRef | null;
  activeRequestTab: RequestTab;
  activeResponseTab: ResponseTab;

  // URL / method / name
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setName: (name: string) => void;

  // Query params (kept in sync with the URL)
  updateParam: (id: string, patch: Partial<KeyValue>) => void;
  removeParam: (id: string) => void;

  // Headers
  updateHeader: (id: string, patch: Partial<KeyValue>) => void;
  removeHeader: (id: string) => void;

  // Auth
  setAuthType: (type: AuthType) => void;
  setBearerToken: (token: string) => void;
  setBasicAuth: (patch: Partial<ApiRequest['auth']['basic']>) => void;
  setApiKeyAuth: (patch: Partial<ApiRequest['auth']['apiKey']>) => void;

  // Body
  setBodyType: (type: BodyType) => void;
  setJsonBody: (json: string) => void;
  setRawBody: (raw: string) => void;
  formatJsonBody: () => void;
  updateFormUrlEncoded: (id: string, patch: Partial<KeyValue>) => void;
  removeFormUrlEncoded: (id: string) => void;
  updateFormData: (id: string, patch: Partial<KeyValue>) => void;
  removeFormData: (id: string) => void;

  // Tabs
  setRequestTab: (tab: RequestTab) => void;
  setResponseTab: (tab: ResponseTab) => void;

  // Lifecycle
  send: () => Promise<void>;
  newRequest: () => void;
  loadRequest: (req: ApiRequest, savedRef?: SavedRequestRef | null) => void;
  importCurl: (text: string) => ParseCurlResult;
  saveToCollection: (collectionId: string, name: string) => ApiRequest | null;
  updateSaved: () => boolean;
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => {
      const patch = (mutate: (r: ApiRequest) => ApiRequest) =>
        set((s) => ({ request: { ...mutate(s.request), updatedAt: Date.now() } }));

      return {
        request: normalizeForEditing(createRequest()),
        response: null,
        error: null,
        isLoading: false,
        sentAt: null,
        savedRef: null,
        activeRequestTab: 'params',
        activeResponseTab: 'body',

        setMethod: (method) => patch((r) => ({ ...r, method })),

        setUrl: (url) =>
          patch((r) => ({ ...r, url, params: withTrailingRow(paramsFromUrl(url)) })),

        setName: (name) => patch((r) => ({ ...r, name })),

        updateParam: (id, p) =>
          patch((r) => {
            const params = withTrailingRow(
              r.params.map((kv) => (kv.id === id ? { ...kv, ...p } : kv)),
            );
            return { ...r, params, url: urlWithParams(r.url, params) };
          }),

        removeParam: (id) =>
          patch((r) => {
            const params = withTrailingRow(r.params.filter((kv) => kv.id !== id));
            return { ...r, params, url: urlWithParams(r.url, params) };
          }),

        updateHeader: (id, p) =>
          patch((r) => ({
            ...r,
            headers: withTrailingRow(
              r.headers.map((kv) => (kv.id === id ? { ...kv, ...p } : kv)),
            ),
          })),

        removeHeader: (id) =>
          patch((r) => ({
            ...r,
            headers: withTrailingRow(r.headers.filter((kv) => kv.id !== id)),
          })),

        setAuthType: (type) => patch((r) => ({ ...r, auth: { ...r.auth, type } })),
        setBearerToken: (token) =>
          patch((r) => ({ ...r, auth: { ...r.auth, bearer: { token } } })),
        setBasicAuth: (p) =>
          patch((r) => ({ ...r, auth: { ...r.auth, basic: { ...r.auth.basic, ...p } } })),
        setApiKeyAuth: (p) =>
          patch((r) => ({ ...r, auth: { ...r.auth, apiKey: { ...r.auth.apiKey, ...p } } })),

        setBodyType: (type) => patch((r) => ({ ...r, body: { ...r.body, type } })),
        setJsonBody: (json) => patch((r) => ({ ...r, body: { ...r.body, json } })),
        setRawBody: (raw) => patch((r) => ({ ...r, body: { ...r.body, raw } })),
        formatJsonBody: () =>
          patch((r) => {
            const result = formatJson(r.body.json);
            return result.ok ? { ...r, body: { ...r.body, json: result.value } } : r;
          }),

        updateFormUrlEncoded: (id, p) =>
          patch((r) => ({
            ...r,
            body: {
              ...r.body,
              formUrlEncoded: withTrailingRow(
                r.body.formUrlEncoded.map((kv) => (kv.id === id ? { ...kv, ...p } : kv)),
              ),
            },
          })),
        removeFormUrlEncoded: (id) =>
          patch((r) => ({
            ...r,
            body: {
              ...r.body,
              formUrlEncoded: withTrailingRow(r.body.formUrlEncoded.filter((kv) => kv.id !== id)),
            },
          })),
        updateFormData: (id, p) =>
          patch((r) => ({
            ...r,
            body: {
              ...r.body,
              formData: withTrailingRow(
                r.body.formData.map((kv) => (kv.id === id ? { ...kv, ...p } : kv)),
              ),
            },
          })),
        removeFormData: (id) =>
          patch((r) => ({
            ...r,
            body: {
              ...r.body,
              formData: withTrailingRow(r.body.formData.filter((kv) => kv.id !== id)),
            },
          })),

        setRequestTab: (activeRequestTab) => set({ activeRequestTab }),
        setResponseTab: (activeResponseTab) => set({ activeResponseTab }),

        send: async () => {
          const { request } = get();
          if (get().isLoading) return;
          set({ isLoading: true, error: null });

          const vars = useEnvironmentStore.getState().getActiveVariables();
          const timeout = useSettingsStore.getState().requestTimeoutMs;

          try {
            const { prepared, result } = await executeRequest(request, vars, timeout);
            if (result.ok) {
              set({
                response: result.response,
                error: null,
                isLoading: false,
                sentAt: Date.now(),
                activeResponseTab: 'body',
              });
            } else {
              set({ response: null, error: result.error, isLoading: false, sentAt: Date.now() });
            }
            useHistoryStore.getState().addEntry(
              {
                id: uuid(),
                method: request.method,
                url: prepared.url || request.url,
                timestamp: Date.now(),
                status: result.ok ? result.response.status : undefined,
                request: structuredClone(request),
              },
              useSettingsStore.getState().historyLimit,
            );
          } catch (err) {
            set({
              response: null,
              error: { type: 'unknown', message: (err as Error).message },
              isLoading: false,
              sentAt: Date.now(),
            });
          }
        },

        newRequest: () =>
          set({
            request: normalizeForEditing(createRequest()),
            savedRef: null,
            response: null,
            error: null,
            isLoading: false,
            sentAt: null,
          }),

        loadRequest: (req, savedRef = null) =>
          set({
            request: normalizeForEditing(structuredClone(req)),
            savedRef,
            response: null,
            error: null,
            isLoading: false,
            sentAt: null,
          }),

        importCurl: (text) => {
          const result = parseCurl(text);
          if (result.ok && result.request) get().loadRequest(result.request, null);
          return result;
        },

        saveToCollection: (collectionId, name) => {
          const saved = useCollectionStore
            .getState()
            .addRequest(collectionId, get().request, name);
          if (saved) {
            set((s) => ({
              savedRef: { collectionId, requestId: saved.id },
              request: { ...s.request, name: saved.name },
            }));
          }
          return saved;
        },

        updateSaved: () => {
          const { savedRef, request } = get();
          if (!savedRef) return false;
          useCollectionStore
            .getState()
            .updateRequest(savedRef.collectionId, { ...request, id: savedRef.requestId });
          return true;
        },
      };
    },
    {
      name: 'apitab:draft',
      storage: createJSONStorage(() => browserLocalStorage),
      partialize: (s) => ({
        request: s.request,
        savedRef: s.savedRef,
        activeRequestTab: s.activeRequestTab,
        activeResponseTab: s.activeResponseTab,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RequestState>;
        return {
          ...current,
          ...p,
          request: p.request ? normalizeForEditing(p.request) : current.request,
        };
      },
    },
  ),
);
