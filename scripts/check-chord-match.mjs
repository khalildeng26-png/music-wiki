// 和弦反查匹配算法自检:用 vite 的 SSR 加载跑(认 @/ 别名),node 直跑。
// 产物:dist/_check/chord-match.mjs,再 import 执行。
import { build } from 'vite';
import { mkdirSync } from 'node:fs';

await build({
  logLevel: 'error',
  build: {
    ssr: true,
    outDir: '.check-out',
    emptyOutDir: true,
    rollupOptions: { input: 'scripts/_chord-match-check.ts' },
  },
});

const mod = await import('../.check-out/_chord-match-check.mjs');
await mod.run();
