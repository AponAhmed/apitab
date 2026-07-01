import {
  SANDBOX_READY,
  SANDBOX_RUN,
  SANDBOX_RESULT,
  type SandboxResultMessage,
} from '@/services/sandboxProtocol';
import { runUserScript } from '@/utils/scriptSandbox';

/*
 * Manifest "sandbox" page: an opaque-origin page whose CSP permits `new Function`
 * (extension pages forbid it). It runs user scripts via runUserScript and talks
 * to the app only through postMessage — no access to extension APIs.
 */
window.addEventListener('message', (e: MessageEvent) => {
  const data = e.data;
  if (!data || data.type !== SANDBOX_RUN) return;
  const result = runUserScript(data.code, data.context);
  const message: SandboxResultMessage = { type: SANDBOX_RESULT, id: data.id, result };
  window.parent.postMessage(message, '*');
});

window.parent.postMessage({ type: SANDBOX_READY }, '*');
