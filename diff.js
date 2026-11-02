// Pure logic: no browser APIs, so it is unit-testable in Node.
export const emptyBaseline = () => ({ visits: 0, thirdParties: [], capabilities: [], scripts: {} });
export const emptyVisit = () => ({ thirdParties: [], capabilities: [], scripts: {} });
export const MAX_SCRIPTS = 200; // per site, to bound storage

// Stored baselines from older versions have no `scripts` field.
export const normalizeBaseline = b => ({ ...emptyBaseline(), ...(b || {}), scripts: { ...(b && b.scripts) } });

export function registrableHost(host) {
  // Naive eTLD+1 (last two labels, three for common 2-level suffixes). Good enough for a prototype.
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const two = parts.slice(-2).join('.');
  return /^(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(two) ? parts.slice(-3).join('.') : two;
}

export function isThirdParty(siteHost, reqHost) {
  return registrableHost(siteHost) !== registrableHost(reqHost);
}

// Identity of an external script: host + path. The query string is dropped because it is
// usually a cache buster, so a changed `?v=` on the same file still compares its content.
export function scriptKey(url) {
  try { const u = new URL(url); return u.host + u.pathname; } catch { return null; }
}

// What is new in `visit` relative to `baseline`? A first visit (visits === 0) yields no alerts.
// `scripts` lists known script keys whose content hash changed; brand-new scripts are not flagged
// (third-party domains already cover new origins).
export function diffVisit(baseline, visit) {
  const base = normalizeBaseline(baseline);
  if (base.visits === 0) return { thirdParties: [], capabilities: [], scripts: [] };
  const known3 = new Set(base.thirdParties);
  const knownC = new Set(base.capabilities);
  return {
    thirdParties: [...visit.thirdParties].filter(d => !known3.has(d)).sort(),
    capabilities: [...visit.capabilities].filter(c => !knownC.has(c)).sort(),
    scripts: Object.keys(visit.scripts || {}).filter(k => k in base.scripts && base.scripts[k] !== visit.scripts[k]).sort(),
  };
}

export function mergeBaseline(baseline, visit) {
  const base = normalizeBaseline(baseline);
  const scripts = { ...base.scripts, ...(visit.scripts || {}) };
  const keys = Object.keys(scripts);
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_SCRIPTS))) delete scripts[k]; // drop oldest
  return {
    visits: base.visits + 1,
    thirdParties: [...new Set([...base.thirdParties, ...visit.thirdParties])].sort(),
    capabilities: [...new Set([...base.capabilities, ...visit.capabilities])].sort(),
    scripts,
  };
}

// "Trust" one flagged item: treat it as known without counting a visit.
export function trustItem(baseline, visit, kind, value) {
  const b = normalizeBaseline(baseline);
  if (kind === 'scripts') { if (visit.scripts && value in visit.scripts) b.scripts[value] = visit.scripts[value]; }
  else if (!b[kind].includes(value)) b[kind] = [...b[kind], value].sort();
  return b;
}

export const countDiff = d => d.thirdParties.length + d.capabilities.length + d.scripts.length;
