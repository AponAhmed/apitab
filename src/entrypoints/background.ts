import { EXECUTE_REQUEST, type RuntimeMessage } from '@/services/messaging';
import { executeHttp } from '@/services/httpClient';
import { openWorkspace } from '@/services/workspace';
import { initSyncService, runAllTeamsSync } from '@/services/syncService';

const SYNC_ALARM = 'apitab:poll-sync';

export default defineBackground(() => {
  // Execute API requests on behalf of the UI (bypasses page CORS).
  browser.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message?.type === EXECUTE_REQUEST) {
      executeHttp(message.payload).then(sendResponse);
      return true; // keep the channel open for the async response
    }
    return false;
  });

  // Keyboard command (Ctrl+Shift+U) opens the workspace.
  browser.commands?.onCommand.addListener((command) => {
    if (command === 'open-apitab') void openWorkspace();
  });

  // Team collection sync: push-on-mutation watcher + cross-context propagation.
  initSyncService();

  // Scheduled polling pull — survives service worker suspension, unlike setInterval.
  browser.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SYNC_ALARM) void runAllTeamsSync();
  });

  // Also sync once immediately when the browser/extension starts up.
  browser.runtime.onStartup.addListener(() => void runAllTeamsSync());
  void runAllTeamsSync();
});
