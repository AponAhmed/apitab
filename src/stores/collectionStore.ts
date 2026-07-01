import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cloneRequest } from '@/utils/defaults';
import { uuid } from '@/utils/id';
import { browserLocalStorage } from './persist';
import type { ApiRequest, Collection } from '@/types';

interface CollectionState {
  collections: Collection[];
  createCollection: (name: string) => Collection;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  duplicateCollection: (id: string) => void;
  /** Saves a copy of `request` into a collection; returns the stored copy. */
  addRequest: (collectionId: string, request: ApiRequest, name?: string) => ApiRequest | null;
  /** Replaces a stored request (matched by id) in place. */
  updateRequest: (collectionId: string, request: ApiRequest) => void;
  duplicateRequest: (collectionId: string, requestId: string) => void;
  deleteRequest: (collectionId: string, requestId: string) => void;
  replaceAll: (collections: Collection[]) => void;
  mergeImported: (collections: Collection[]) => void;
}

function touch(collection: Collection): Collection {
  return { ...collection, updatedAt: Date.now() };
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],

      createCollection: (name) => {
        const now = Date.now();
        const collection: Collection = {
          id: uuid(),
          name: name.trim() || 'New Collection',
          requests: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ collections: [...s.collections, collection] }));
        return collection;
      },

      renameCollection: (id, name) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? touch({ ...c, name: name.trim() || c.name }) : c,
          ),
        })),

      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      duplicateCollection: (id) =>
        set((s) => {
          const original = s.collections.find((c) => c.id === id);
          if (!original) return s;
          const now = Date.now();
          const copy: Collection = {
            id: uuid(),
            name: `${original.name} Copy`,
            requests: original.requests.map((r) => cloneRequest(r)),
            createdAt: now,
            updatedAt: now,
          };
          const index = s.collections.findIndex((c) => c.id === id);
          const next = [...s.collections];
          next.splice(index + 1, 0, copy);
          return { collections: next };
        }),

      addRequest: (collectionId, request, name) => {
        const collection = get().collections.find((c) => c.id === collectionId);
        if (!collection) return null;
        const saved = cloneRequest(request, { name: (name ?? request.name).trim() || 'Untitled Request' });
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId ? touch({ ...c, requests: [...c.requests, saved] }) : c,
          ),
        }));
        return saved;
      },

      updateRequest: (collectionId, request) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? touch({
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === request.id ? { ...request, updatedAt: Date.now() } : r,
                  ),
                })
              : c,
          ),
        })),

      duplicateRequest: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const index = c.requests.findIndex((r) => r.id === requestId);
            if (index === -1) return c;
            const copy = cloneRequest(c.requests[index], {
              name: `${c.requests[index].name} Copy`,
            });
            const requests = [...c.requests];
            requests.splice(index + 1, 0, copy);
            return touch({ ...c, requests });
          }),
        })),

      deleteRequest: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? touch({ ...c, requests: c.requests.filter((r) => r.id !== requestId) })
              : c,
          ),
        })),

      replaceAll: (collections) => set({ collections }),

      mergeImported: (incoming) =>
        set((s) => {
          const byId = new Map(s.collections.map((c) => [c.id, c]));
          for (const c of incoming) byId.set(c.id, c);
          return { collections: [...byId.values()] };
        }),
    }),
    {
      name: 'apitab:collections',
      storage: createJSONStorage(() => browserLocalStorage),
      partialize: ({ collections }) => ({ collections }),
    },
  ),
);
