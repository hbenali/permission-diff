// Builds build/chrome (the repo manifest as is) and build/firefox (background.scripts + gecko id).
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
const FILES = ['background.js', 'diff.js', 'hook.js', 'relay.js', 'popup.html', 'popup.js'];
const base = JSON.parse(readFileSync('manifest.json', 'utf8'));
rmSync('build', { recursive: true, force: true });
for (const target of ['chrome', 'firefox']) {
  const dir = `build/${target}`;
  mkdirSync(dir, { recursive: true });
  for (const f of FILES) cpSync(f, `${dir}/${f}`);
  const m = structuredClone(base);
  if (target === 'firefox') {
    m.background = { scripts: ['background.js'], type: 'module' };
    m.browser_specific_settings = { gecko: {
      id: 'permission-diff@hbenali.github.io', strict_min_version: '128.0',
      data_collection_permissions: { required: ['none'] } } };
  }
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(m, null, 2) + '\n');
}
console.log('built', base.version);
