import { useState } from 'react';
import { useDialogStore } from '@/stores/dialogStore';
import { useAccountStore } from '@/stores/accountStore';
import { useTeamStore } from '@/stores/teamStore';
import { apiClient, ApiError } from '@/services/apiClient';
import { runAllTeamsSync } from '@/services/syncService';
import { toast } from '@/stores/toastStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Mode = 'login' | 'register';

export function LoginDialog() {
  const open = useDialogStore((s) => s.loginOpen);
  const close = useDialogStore((s) => s.closeLogin);
  const setSession = useAccountStore((s) => s.setSession);
  const setTeams = useTeamStore((s) => s.setTeams);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMode('login');
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    close();
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const session =
        mode === 'login'
          ? await apiClient.login(email, password)
          : await apiClient.register(name, email, password);

      setSession(session);
      toast.success(mode === 'login' ? 'Logged in' : 'Account created');

      try {
        const { teams } = await apiClient.fetchTeams();
        setTeams(teams);
        void runAllTeamsSync();
      } catch {
        // Non-fatal — teams can be loaded later from the team switcher.
      }

      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    email.trim() !== '' &&
    password.trim() !== '' &&
    (mode === 'login' || name.trim() !== '') &&
    !loading;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === 'login' ? 'Log in' : 'Create account'}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={!canSubmit}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void submit();
        }}
      >
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Name
            </span>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Email
          </span>
          <Input
            type="email"
            autoFocus={mode === 'login'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Password
          </span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Log in'}
        </button>
      </form>
    </Modal>
  );
}
