/* Cross-platform static-export build for GitHub Pages.
 * Sets PAGES_BUILD so next.config.mjs applies the /macro-lab basePath,
 * then ensures out/.nojekyll exists (GitHub Pages must not run Jekyll,
 * which would ignore the _next directory). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const r = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PAGES_BUILD: 'true' },
});
if (r.status !== 0) process.exit(r.status ?? 1);

fs.writeFileSync('out/.nojekyll', '');
console.log('out/.nojekyll written');
