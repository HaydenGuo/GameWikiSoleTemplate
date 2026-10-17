import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const declaredPackageManager = packageJson.packageManager;
const expectedPrefix = 'pnpm@';

if (typeof declaredPackageManager !== 'string' || !declaredPackageManager.startsWith(expectedPrefix)) {
  console.error('项目必须在 package.json 中声明固定版本的 pnpm。');
  process.exit(1);
}

const expectedVersion = declaredPackageManager.slice(expectedPrefix.length).split('+')[0];
const userAgent = process.env.npm_config_user_agent ?? process.env.NPM_CONFIG_USER_AGENT ?? '';
const activePackageManager = userAgent.trim().split(/\s+/)[0];
let activePnpmVersion = /^pnpm\/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(activePackageManager)?.[1];

if (!activePnpmVersion && process.env.npm_execpath) {
  try {
    activePnpmVersion = execFileSync(process.execPath, [process.env.npm_execpath, '--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // Keep the version check failure below actionable when the active CLI cannot be queried.
  }
}

if (activePnpmVersion !== expectedVersion) {
  const detected = activePnpmVersion || activePackageManager || '未提供';
  console.error(
    `本项目要求使用 pnpm ${expectedVersion}，当前检测到 ${detected}。请运行：corepack pnpm install`,
  );
  process.exit(1);
}

const incompatibleLockfiles = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'bun.lock', 'bun.lockb'];
const foundLockfiles = incompatibleLockfiles.filter((file) =>
  fs.existsSync(path.join(projectRoot, file)),
);
if (foundLockfiles.length > 0) {
  console.error(
    `发现非 pnpm 锁文件：${foundLockfiles.join(', ')}。本项目只保留 pnpm-lock.yaml；请确认后移除这些文件。`,
  );
  process.exit(1);
}
