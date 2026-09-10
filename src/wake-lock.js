// Optional screen-wake support. No-op when the platform doesn't offer it,
// so browser use is unaffected. Replace the body of request()/release() with
// the native equivalent when this ships inside an iOS shell.
(function () {
  let sentinel = null;

  async function request() {
    if (sentinel) return true;
    try {
      if (!('wakeLock' in navigator)) return false;
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; });
      return true;
    } catch (e) { sentinel = null; return false; }
  }

  function release() {
    if (sentinel) { try { sentinel.release(); } catch (e) {} sentinel = null; }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.DrillWakeLock.wanted) request();
  });

  window.DrillWakeLock = {
    wanted: false,
    enable() { this.wanted = true; return request(); },
    disable() { this.wanted = false; release(); },
    supported: 'wakeLock' in navigator
  };
})();
