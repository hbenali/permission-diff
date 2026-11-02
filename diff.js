// Pure logic: no browser APIs, so it is unit-testable in Node.
export const emptyBaseline = () => ({ visits: 0, thirdParties: [], capabilities: [] });

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

// What is new in `visit` relative to `baseline`? A first visit (visits === 0) yields no alerts.
export function diffVisit(baseline, visit) {
  if (baseline.visits === 0) return { thirdParties: [], capabilities: [] };
  const known3 = new Set(baseline.thirdParties);
  const knownC = new Set(baseline.capabilities);
  return {
    thirdParties: [...visit.thirdParties].filter(d => !known3.has(d)).sort(),
    capabilities: [...visit.capabilities].filter(c => !knownC.has(c)).sort(),
  };
}

export function mergeBaseline(baseline, visit) {
  return {
    visits: baseline.visits + 1,
    thirdParties: [...new Set([...baseline.thirdParties, ...visit.thirdParties])].sort(),
    capabilities: [...new Set([...baseline.capabilities, ...visit.capabilities])].sort(),
  };
}
