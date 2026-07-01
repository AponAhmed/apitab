import { EXECUTE_REQUEST, type RuntimeMessage } from '@/services/messaging';
import { executeHttp } from '@/services/httpClient';
import { openWorkspace } from '@/services/workspace';

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
});
