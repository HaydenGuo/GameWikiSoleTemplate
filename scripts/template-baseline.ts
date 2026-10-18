/**
 * Template preservation baseline.
 *
 * A fork may change the template's identity, copy, routes, and articles, but
 * an AI-assisted edit must not silently delete an existing template file.
 * Create a baseline immediately after copying/applying the template, then run
 * `pnpm template-baseline:check` after each meaningful batch of edits.
 *
 * The check is deliberately narrow: changes are allowed; undeclared missing
 * files are not. Intentional removals belong in `docs/template-baseline.json`
 * under `allowed_deletions`, with a reason in the adjacent note.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = path.resolve(ROOT, 'docs/template-baseline.json');
const SCHEMA_VERSION = 1;

const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.astro',
  'dist',
  'node_modules',
  'tmp-preview',
  '.vercel',
  'coverage',
]);

type BaselineFile = { path: string; bytes: number; sha256: string };
type AllowedDeletion = { path: string; reason: string };
type JsonContract = { path: string; required_paths: string[] };
type Baseline = {
  schema_version: number;
  created_at: string;
  source_template: string;
  allowed_deletions: AllowedDeletion[];
  files: BaselineFile[];
  json_contracts: JsonContract[];
};

function toRelative(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function shouldIgnore(relativePath: string): boolean {
  return relativePath
    .split('/')
    .some((part) => IGNORED_DIRECTORY_NAMES.has(part) || part.startsWith('node_modules.stale-'));
}

function walk(dir: string, result: string[] = []): string[] {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    const relativePath = toRelative(filePath);
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) walk(filePath, result);
    else if (entry.isFile()) result.push(relativePath);
  }
  return result;
}

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function currentFiles(): BaselineFile[] {
  return walk(ROOT)
    .filter((relativePath) => relativePath !== 'docs/template-baseline.json')
    .sort()
    .map((relativePath) => {
      const absolutePath = path.resolve(ROOT, relativePath);
      return { path: relativePath, bytes: fs.statSync(absolutePath).size, sha256: sha256(absolutePath) };
    });
}

function collectJsonPaths(value: unknown, prefix = '', result: string[] = []): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [key, child] of Object.entries(value)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    result.push(currentPath);
    collectJsonPaths(child, currentPath, result);
  }
  return result;
}

function currentJsonContracts(): JsonContract[] {
  return walk(ROOT)
    .filter((relativePath) => /^src\/locales\/[^/]+\.json$/.test(relativePath))
    .sort()
    .map((relativePath) => {
      const parsed = JSON.parse(fs.readFileSync(path.resolve(ROOT, relativePath), 'utf8')) as unknown;
      return { path: relativePath, required_paths: collectJsonPaths(parsed) };
    });
}

function readBaseline(): Baseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error('❌ docs/template-baseline.json 不存在。先运行：pnpm template-baseline:create');
    process.exit(1);
  }
  let parsed: Baseline;
  try {
    parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
  } catch (error) {
    console.error(`❌ 无法读取 docs/template-baseline.json：${(error as Error).message}`);
    process.exit(1);
  }
  if (parsed.schema_version !== SCHEMA_VERSION || !Array.isArray(parsed.files)) {
    console.error(`❌ template-baseline.json schema_version 必须为 ${SCHEMA_VERSION}，且 files 必须是数组。`);
    process.exit(1);
  }
  const allowedDeletions = Array.isArray(parsed.allowed_deletions) ? parsed.allowed_deletions : [];
  if (
    allowedDeletions.some(
      (entry) =>
        !entry ||
        typeof entry !== 'object' ||
        typeof entry.path !== 'string' ||
        entry.path.trim() === '' ||
        typeof entry.reason !== 'string' ||
        entry.reason.trim() === '',
    )
  ) {
    console.error('❌ allowed_deletions 的每一项必须包含非空 path 和 reason。');
    process.exit(1);
  }
  return {
    ...parsed,
    allowed_deletions: allowedDeletions,
    json_contracts: Array.isArray(parsed.json_contracts) ? parsed.json_contracts : [],
  };
}

function globToRegExp(glob: string): RegExp {
  let output = '^';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') {
      output += '.*';
      i++;
    } else if (char === '*') output += '[^/]*';
    else if (char === '?') output += '[^/]';
    else output += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${output}$`);
}

function isAllowedDeletion(relativePath: string, entries: AllowedDeletion[]): boolean {
  return entries.some((entry) => globToRegExp(entry.path.replaceAll('\\', '/')).test(relativePath));
}

function createBaseline(): void {
  if (fs.existsSync(BASELINE_PATH) && !process.argv.includes('--force')) {
    console.error('❌ 基线已存在。若要重新建立，请明确使用：pnpm template-baseline:create -- --force');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  const baseline: Baseline = {
    schema_version: SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    source_template: path.basename(ROOT),
    allowed_deletions: [],
    files: currentFiles(),
    json_contracts: currentJsonContracts(),
  };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  console.log(`✅ 已建立模板基线：${baseline.files.length} 个文件`);
  console.log('   下一步：每批开发完成后运行 pnpm template-baseline:check');
}

function checkBaseline(): void {
  const baseline = readBaseline();
  const current = new Map(currentFiles().map((file) => [file.path, file]));
  const deleted = baseline.files.filter((file) => !current.has(file.path));
  const undeclared = deleted.filter((file) => !isAllowedDeletion(file.path, baseline.allowed_deletions));
  const declared = deleted.filter((file) => isAllowedDeletion(file.path, baseline.allowed_deletions));
  const changed = baseline.files.filter((file) => {
    const now = current.get(file.path);
    return now && (now.sha256 !== file.sha256 || now.bytes !== file.bytes);
  });
  const added = [...current.values()].filter((file) => !baseline.files.some((base) => base.path === file.path));
  const missingJsonPaths: string[] = [];
  for (const contract of baseline.json_contracts) {
    const absolutePath = path.resolve(ROOT, contract.path);
    if (!fs.existsSync(absolutePath)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as unknown;
    } catch {
      continue;
    }
    const currentPaths = new Set(collectJsonPaths(parsed));
    for (const requiredPath of contract.required_paths) {
      if (!currentPaths.has(requiredPath)) missingJsonPaths.push(`${contract.path}:${requiredPath}`);
    }
  }

  console.log('\n🛡️ 模板内容保真检查\n');
  console.log(`基线：${baseline.created_at} · 原始文件：${baseline.files.length} · 当前文件：${current.size}`);
  console.log(`修改：${changed.length} · 新增：${added.length} · 删除：${deleted.length}`);
  if (declared.length > 0) {
    console.log(`\n⚠️ 已声明删除 ${declared.length} 个文件：`);
    for (const file of declared) {
      const rule = baseline.allowed_deletions.find((entry) => globToRegExp(entry.path.replaceAll('\\', '/')).test(file.path));
      console.log(`   - ${file.path}${rule ? `（原因：${rule.reason}）` : ''}`);
    }
  }
  if (undeclared.length > 0) {
    console.error('\n❌ 发现未声明的模板文件删除：');
    for (const file of undeclared) console.error(`   - ${file.path}`);
    console.error('\n请恢复文件，或在 docs/template-baseline.json 的 allowed_deletions 中登记明确的删除范围。');
    process.exit(1);
  }
  if (missingJsonPaths.length > 0) {
    console.error('\n❌ 发现模板 locale JSON 结构路径消失：');
    for (const missingPath of missingJsonPaths) console.error(`   - ${missingPath}`);
    console.error('\n请恢复被覆盖的字段，或先确认这是明确的模板契约变更并更新对应的开发记录。');
    process.exit(1);
  }
  console.log('\n✅ 未发现未声明的模板文件删除。修改和新增内容可以继续进入其他质量检查。\n');
}

const command = process.argv[2] ?? 'check';
if (command === 'create') createBaseline();
else if (command === 'check') checkBaseline();
else {
  console.error(`❌ 未知命令：${command}。可用命令：create | check`);
  process.exit(1);
}
