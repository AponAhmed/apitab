import { ExternalLink, History as HistoryIcon } from 'lucide-react';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useHistoryStore } from '@/stores/historyStore';
import { useRequestStore } from '@/stores/requestStore';
import { openWorkspace } from '@/services/workspace';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { MethodBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils/format';
import type { HistoryEntry } from '@/types';

export function PopupPage() {
  useApplyTheme();
  const entries = useHistoryStore((s) => s.entries).slice(0, 7);
  const loadRequest = useRequestStore((s) => s.loadRequest);

  const openApp = async () => {
    await openWorkspace();
    window.close();
  };

  const reopen = async (entry: HistoryEntry) => {
    // Persisted to the shared draft storage, then picked up when the tab loads.
    loadRequest(entry.request);
    await new Promise((r) => setTimeout(r, 80));
    await openWorkspace();
    window.close();
  };

  return (
    <div className="flex w-[340px] flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <Logo className="h-6 w-6" />
        <span className="text-sm font-semibold">ApiTab</span>
      </div>

      <div className="p-3">
        <Button variant="primary" className="w-full" onClick={openApp}>
          <ExternalLink className="h-4 w-4" />
          Open ApiTab
        </Button>
      </div>

      <div className="px-3 pb-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <HistoryIcon className="h-3 w-3" />
          Recent
        </p>
        {entries.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">No recent requests</p>
        ) : (
          <div className="-mx-1">
            {entries.map((e) => (
              <button
                key={e.id}
                onClick={() => reopen(e)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="w-10 shrink-0 text-right">
                  <MethodBadge method={e.method} className="text-[10px]" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                  {e.url || 'Untitled'}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {formatRelativeTime(e.timestamp)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
