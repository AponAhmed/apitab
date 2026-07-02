import { useState } from 'react';
import { LogIn, RefreshCw, UserPlus, Users } from 'lucide-react';
import { useAccountStore } from '@/stores/accountStore';
import { useTeamStore } from '@/stores/teamStore';
import { useDialogStore } from '@/stores/dialogStore';
import { apiClient } from '@/services/apiClient';
import { runAllTeamsSync } from '@/services/syncService';
import { toast } from '@/stores/toastStore';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { IconButton } from '@/components/ui/IconButton';
import { PromptDialog } from '@/components/PromptDialog';
import { cn } from '@/utils/cn';

const NEW_TEAM = '__new_team__';

export function AccountMenu() {
  const session = useAccountStore((s) => s.session);
  const clearSession = useAccountStore((s) => s.clearSession);
  const openLogin = useDialogStore((s) => s.openLogin);

  const teams = useTeamStore((s) => s.teams);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const setActiveTeam = useTeamStore((s) => s.setActiveTeam);
  const setTeams = useTeamStore((s) => s.setTeams);
  const isSyncing = useTeamStore((s) => s.isSyncing);
  const resetTeams = useTeamStore((s) => s.reset);

  const [createOpen, setCreateOpen] = useState(false);

  const createTeam = async (name: string) => {
    try {
      const created = await apiClient.createTeam(name);
      setTeams([...teams, created]);
      setActiveTeam(created.id);
      toast.success(`Created "${created.name}"`);
    } catch {
      toast.error('Could not create team');
    }
  };

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={openLogin}>
        <LogIn className="h-3.5 w-3.5" />
        Log in
      </Button>
    );
  }

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Token may already be invalid server-side — clear locally regardless.
    }
    clearSession();
    resetTeams();
    toast.info('Logged out');
  };

  return (
    <div className="flex items-center gap-1.5">
      {teams.length > 0 ? (
        <div className="flex items-center gap-1" title="Active team">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          <Select
            value={activeTeamId ?? ''}
            onChange={(e) => {
              if (e.target.value === NEW_TEAM) setCreateOpen(true);
              else setActiveTeam(e.target.value || null);
            }}
            className="h-8 w-36 text-xs"
            aria-label="Active team"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value={NEW_TEAM}>+ New team…</option>
          </Select>
        </div>
      ) : (
        <IconButton size="sm" title="Create a team" aria-label="Create a team" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
        </IconButton>
      )}

      <IconButton
        size="sm"
        title="Sync now"
        aria-label="Sync now"
        onClick={() => void runAllTeamsSync()}
        disabled={isSyncing}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
      </IconButton>

      <span
        className="max-w-[8rem] truncate text-xs text-slate-500 dark:text-slate-400"
        title={session.user.email}
      >
        {session.user.name}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void logout()}>
        Log out
      </Button>

      <PromptDialog
        open={createOpen}
        title="Create Team"
        label="Team name"
        placeholder="My Team"
        confirmLabel="Create"
        onConfirm={(v) => void createTeam(v)}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
