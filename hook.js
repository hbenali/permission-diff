// Runs in the page (MAIN world). Observes capability use; never blocks or alters behaviour.
(() => {
  const report = cap => window.postMessage({ __permDiff: true, cap }, '*');
  const wrap = (obj, name, cap) => {
    try {
      const orig = obj && obj[name];
      if (typeof orig !== 'function') return;
      obj[name] = function (...a) { report(cap); return orig.apply(this, a); };
    } catch (_) { /* hardened page: ignore */ }
  };
  wrap(navigator.geolocation, 'getCurrentPosition', 'geolocation');
  wrap(navigator.geolocation, 'watchPosition', 'geolocation');
  wrap(navigator.mediaDevices, 'getUserMedia', 'camera/microphone');
  wrap(navigator.mediaDevices, 'getDisplayMedia', 'screen-capture');
  wrap(navigator.clipboard, 'readText', 'clipboard-read');
  wrap(navigator.clipboard, 'read', 'clipboard-read');
  wrap(navigator.serviceWorker, 'register', 'service-worker');
  wrap(window.Notification, 'requestPermission', 'notifications');
  if (window.RTCPeerConnection) {
    const Orig = window.RTCPeerConnection;
    window.RTCPeerConnection = new Proxy(Orig, { construct(t, args) { report('webrtc'); return Reflect.construct(t, args); } });
  }
})();
