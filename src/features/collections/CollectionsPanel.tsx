import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Folder,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { useCollectionStore } from '@/stores/collectionStore';
import { useRequestStore } from '@/stores/requestStore';
import { IconButton } from '@/components/ui/IconButton';
import { MethodBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PromptDialog } from '@/components/PromptDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/utils/cn';
import type { ApiRequest, Collection } from '@/types';

export function CollectionsPanel() {
  const collections = useCollectionStore((s) => s.collections);
  const createCollection = useCollectionStore((s) => s.createCollection);
  const renameCollection = useCollectionStore((s) => s.renameCollection);
  const deleteCollection = useCollectionStore((s) => s.deleteCollection);
  const duplicateCollection = useCollectionStore((s) => s.duplicateCollection);
  const duplicateRequest = useCollectionStore((s) => s.duplicateRequest);
  const deleteRequest = useCollectionStore((s) => s.deleteRequest);

  const loadRequest = useRequestStore((s) => s.loadRequest);
  const activeRequestId = useRequestStore((s) => s.savedRef?.requestId ?? null);

  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [deleteCollTarget, setDeleteCollTarget] = useState<Collection | null>(null);
  const [deleteReqTarget, setDeleteReqTarget] = useState<{
    collectionId: string;
    req: ApiRequest;
  } | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return collections;
    return collections
      .map((c) =>
        c.name.toLowerCase().includes(q)
          ? c
          : {
              ...c,
              requests: c.requests.filter(
                (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
              ),
            },
      )
      .filter((c) => c.name.toLowerCase().includes(q) || c.requests.length > 0);
  }, [collections, q]);

  const openRequest = (collectionId: string, req: ApiRequest) =>
    loadRequest(req, { collectionId, requestId: req.id });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 p-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200"
          />
        </div>
        <IconButton size="sm" title="New collection" onClick={() => setCreateOpen(true)}>
          <FolderPlus className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1 pb-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Folder}
            title={q ? 'No matches' : 'No collections'}
            description={q ? undefined : 'Save a request to create your first collection.'}
          />
        ) : (
          filtered.map((c) => {
            const isCollapsed = !!collapsed[c.id] && !q;
            return (
              <div key={c.id} className="mb-0.5">
                <div className="group flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/70">
                  <button
                    onClick={() => setCollapsed((s) => ({ ...s, [c.id]: !isCollapsed }))}
                    className="flex min-w-0 flex-1 items-center gap-1 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">{c.requests.length}</span>
                  </button>
                  <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
                    <IconButton size="sm" title="Rename" onClick={() => setRenameTarget(c)}>
                      <Pencil className="h-3 w-3" />
                    </IconButton>
                    <IconButton size="sm" title="Duplicate" onClick={() => duplicateCollection(c.id)}>
                      <Copy className="h-3 w-3" />
                    </IconButton>
                    <IconButton size="sm" title="Delete" onClick={() => setDeleteCollTarget(c)}>
                      <Trash2 className="h-3 w-3" />
                    </IconButton>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="ml-3 border-l border-slate-200 pl-1 dark:border-slate-800">
                    {c.requests.length === 0 ? (
                      <p className="px-2 py-1 text-[11px] text-slate-400">No requests yet</p>
                    ) : (
                      c.requests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => openRequest(c.id, req)}
                          className={cn(
                            'group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/70',
                            activeRequestId === req.id && 'bg-brand-50 dark:bg-brand-950/40',
                          )}
                        >
                          <span className="w-10 shrink-0 text-right">
                            <MethodBadge method={req.method} className="text-[10px]" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                            {req.name || req.url || 'Untitled'}
                          </span>
                          <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
                            <IconButton
                              size="sm"
                              title="Duplicate"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateRequest(c.id, req.id);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </IconButton>
                            <IconButton
                              size="sm"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteReqTarget({ collectionId: c.id, req });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </IconButton>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <PromptDialog
        open={createOpen}
        title="New Collection"
        label="Collection name"
        placeholder="My Collection"
        confirmLabel="Create"
        onConfirm={(v) => createCollection(v)}
        onClose={() => setCreateOpen(false)}
      />
      <PromptDialog
        open={!!renameTarget}
        title="Rename Collection"
        label="Collection name"
        initialValue={renameTarget?.name ?? ''}
        confirmLabel="Rename"
        onConfirm={(v) => renameTarget && renameCollection(renameTarget.id, v)}
        onClose={() => setRenameTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteCollTarget}
        title="Delete Collection"
        message={
          <>
            Delete <b>{deleteCollTarget?.name}</b> and all of its requests? This cannot be undone.
          </>
        }
        onConfirm={() => deleteCollTarget && deleteCollection(deleteCollTarget.id)}
        onClose={() => setDeleteCollTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteReqTarget}
        title="Delete Request"
        message={
          <>
            Delete <b>{deleteReqTarget?.req.name || 'this request'}</b>?
          </>
        }
        onConfirm={() =>
          deleteReqTarget && deleteRequest(deleteReqTarget.collectionId, deleteReqTarget.req.id)
        }
        onClose={() => setDeleteReqTarget(null)}
      />
    </div>
  );
}
