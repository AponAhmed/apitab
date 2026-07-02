import { apiClient, ConflictError } from './apiClient';
import { useAccountStore } from '@/stores/accountStore';
import { useTeamStore } from '@/stores/teamStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { toast } from '@/stores/toastStore';
import type { Collection } from '@/types';

/*
 * Owns all awareness of "sync this to the server." collectionStore itself
 * stays pure local state; this module watches it, pushes team-tagged edits,
 * pulls periodic changes, and reconciles the two extension-context problems
 * that come from browser.storage.local not being live-shared:
 *
 *  1. Each extension page (app/popup/options) and the background service
 *     worker hold independent in-memory copies of the Zustand store. A push
 *     made from the app page won't be visible in the background worker (or
 *     another open page) until that context re-hydrates from storage.
 *  2. A pull merge must not immediately re-trigger a push of the very data
 *     it just wrote (feedback loop). The `applyingRemote` flag suppresses
 *     the push-on-mutation watcher for the duration of any remote-origin
 *     write (a pull merge, or a rehydrate caused by another context's push).
 */

let applyingRemote = false;
/** Last known pushed/pulled `updatedAt` per collection id, to diff future local edits. */
const pushedVersions = new Map<string, number>();

async function pushTeamCollection(teamId: string, collection: Collection) {
  try {
    const updated = await apiClient.updateRemoteCollection(teamId, collection);
    pushedVersions.set(collection.id, updated.updatedAt);
    applyingRemote = true;
    useCollectionStore.setState((s) => ({
      collections: s.collections.map((c) =>
        c.id === collection.id ? { ...c, updatedAt: updated.updatedAt } : c,
      ),
    }));
  } catch (err) {
    if (err instanceof ConflictError) {
      // Confirmed rule: server wins, no merge UI. Adopt its copy.
      pushedVersions.set(collection.id, err.current.updatedAt);
      applyingRemote = true;
      useCollectionStore.getState().mergeSync(teamId, [err.current], []);
      toast.info(`"${err.current.name}" was updated elsewhere — synced the latest version.`);
    }
    // Network/other errors: leave local state; the next mutation or poll retries.
  } finally {
    applyingRemote = false;
  }
}

function onCollectionsChanged(
  state: ReturnType<typeof useCollectionStore.getState>,
  prevState: ReturnType<typeof useCollectionStore.getState>,
) {
  if (applyingRemote) return;

  for (const c of state.collections) {
    if (!c.teamId) continue;
    const known = pushedVersions.get(c.id);
    if (known === undefined) {
      // First time we've seen this team-tagged collection in this context
      // (e.g. just rehydrated) — record its version without pushing.
      pushedVersions.set(c.id, c.updatedAt);
      continue;
    }
    if (c.updatedAt > known) {
      pushedVersions.set(c.id, c.updatedAt); // optimistic, avoids duplicate concurrent pushes
      void pushTeamCollection(c.teamId, c);
    }
  }

  const currentIds = new Set(state.collections.map((c) => c.id));
  for (const prev of prevState.collections) {
    if (prev.teamId && !currentIds.has(prev.id)) {
      pushedVersions.delete(prev.id);
      void apiClient.deleteRemoteCollection(prev.teamId, prev.id).catch(() => {
        // Best-effort: if this fails the item may reappear on next pull, which is safe.
      });
    }
  }
}

let initialized = false;

/** Wires push-on-mutation and cross-context propagation. Safe to call repeatedly. */
export function initSyncService(): void {
  if (initialized) return;
  initialized = true;

  for (const c of useCollectionStore.getState().collections) {
    if (c.teamId) pushedVersions.set(c.id, c.updatedAt);
  }

  useCollectionStore.subscribe(onCollectionsChanged);

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !('apitab:collections' in changes)) return;
    applyingRemote = true;
    void useCollectionStore.persist.rehydrate()?.finally(() => {
      applyingRemote = false;
      for (const c of useCollectionStore.getState().collections) {
        if (c.teamId && !pushedVersions.has(c.id)) pushedVersions.set(c.id, c.updatedAt);
      }
    });
  });
}

/** Shares a local (untagged) collection with a team: creates it remotely. */
export async function shareCollectionToTeam(collectionId: string, teamId: string): Promise<void> {
  const collection = useCollectionStore.getState().collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error('Collection not found');

  const created = await apiClient.createRemoteCollection(teamId, collection);
  pushedVersions.set(collectionId, created.updatedAt);
  applyingRemote = true;
  try {
    useCollectionStore.setState((s) => ({
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, teamId, updatedAt: created.updatedAt } : c,
      ),
    }));
  } finally {
    applyingRemote = false;
  }
}

export async function runSyncTick(teamId: string): Promise<void> {
  useTeamStore.getState().setSyncing(true);
  try {
    const since = useTeamStore.getState().lastSyncedAt[teamId] ?? 0;
    const res = await apiClient.fetchSync(teamId, since);

    applyingRemote = true;
    try {
      useCollectionStore.getState().mergeSync(teamId, res.collections, res.deletedCollectionIds);
    } finally {
      applyingRemote = false;
    }

    for (const c of res.collections) pushedVersions.set(c.id, c.updatedAt);
    for (const id of res.deletedCollectionIds) pushedVersions.delete(id);

    useTeamStore.getState().recordSync(teamId, res.serverTime);
    useTeamStore.getState().setSyncError(null);
  } catch (err) {
    useTeamStore.getState().setSyncError(err instanceof Error ? err.message : 'Sync failed');
  } finally {
    useTeamStore.getState().setSyncing(false);
  }
}

/** Runs one polling pass across every team the user belongs to. No-op if logged out. */
export async function runAllTeamsSync(): Promise<void> {
  // On a freshly woken service worker, persisted state may not have finished
  // hydrating from browser.storage.local yet — make sure it has before
  // trusting `session`/`teams`, otherwise a cold wake could read stale
  // (empty) initial state and silently skip a poll.
  await useAccountStore.persist.rehydrate();
  await useTeamStore.persist.rehydrate();

  if (!useAccountStore.getState().session) return;
  for (const team of useTeamStore.getState().teams) {
    await runSyncTick(team.id);
  }
}
