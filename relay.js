// Isolated world: forwards MAIN-world reports to the background worker.
window.addEventListener('message', e => {
  if (e.source !== window || !e.data || e.data.__permDiff !== true) return;
  if (typeof e.data.cap !== 'string' || e.data.cap.length > 40) return;
  chrome.runtime.sendMessage({ type: 'cap', cap: e.data.cap }).catch(() => {});
});
