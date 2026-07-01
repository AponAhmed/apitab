import { useState } from 'react';
import { Info, PanelLeft, Settings } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { IconButton } from '@/components/ui/IconButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { AboutDialog } from '@/components/AboutDialog';
import { EnvironmentSelector } from '@/features/environments/EnvironmentSelector';

export function TopBar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2.5 dark:border-slate-800 dark:bg-slate-900">
      <IconButton title="Toggle sidebar" aria-label="Toggle sidebar" onClick={toggleSidebar}>
        <PanelLeft className="h-4 w-4" />
      </IconButton>

      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6" />
        <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          ApiTab
        </span>
      </div>

      <div className="flex-1" />

      <EnvironmentSelector />
      <ThemeToggle />
      <IconButton title="About" aria-label="About ApiTab" onClick={() => setAboutOpen(true)}>
        <Info className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Settings"
        aria-label="Open settings"
        onClick={() => browser.runtime.openOptionsPage()}
      >
        <Settings className="h-4 w-4" />
      </IconButton>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </header>
  );
}
