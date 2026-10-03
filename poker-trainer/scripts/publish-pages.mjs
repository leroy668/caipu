/**
 * 把打包好的单文件 HTML 复制到仓库根目录的 public/poker/index.html，
 * 这样它会随 GitHub Pages 一起发布，手机浏览器直接访问即可。
 *
 * 用法：npm run publish:pages
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '..', 'flop-trainer.html');
const target = resolve(here, '..', '..', 'public', 'poker', 'index.html');

if (!existsSync(source)) {
  console.error('[publish-pages] 找不到 flop-trainer.html，请先运行 npm run build:single');
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

console.log(
  `[publish-pages] 已复制到 ${target}（${(statSync(target).size / 1024).toFixed(1)} KB）`,
);
console.log('[publish-pages] 接下来：git add public/poker/index.html && git push');
