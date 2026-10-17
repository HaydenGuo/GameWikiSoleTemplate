import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type PublishConfig = { publishPaths?: string[] };

function readArg(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function globToRegExp(glob: string): RegExp {
  let source = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') {
      source += '.*';
      i += 1;
    } else if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${source}$`);
}

function readChangedPaths(): string[] {
  try {
    const output = execFileSync('git', ['status', '--porcelain=v1', '-z'], { encoding: 'utf8' });
    return output
      .split('\0')
      .filter(Boolean)
      .map((entry) => entry.slice(3).replaceAll('\\', '/'))
      .flatMap((entry) => (entry.includes(' -> ') ? entry.split(' -> ') : [entry]));
  } catch {
    console.log('ℹ️ 未发现可读取的 Git 工作树状态；仅完成配置结构检查。');
    return [];
  }
}

const configPath = path.resolve(process.cwd(), readArg('--config', 'site.publish.example.json'));
if (!fs.existsSync(configPath)) {
  console.error(`❌ 发布配置不存在：${configPath}`);
  process.exit(2);
}

let config: PublishConfig;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as PublishConfig;
} catch (error) {
  console.error(`❌ 发布配置不是有效 JSON：${(error as Error).message}`);
  process.exit(2);
}

const patterns = (config.publishPaths ?? []).filter((entry) => typeof entry === 'string' && entry.trim());
if (patterns.length === 0) {
  console.error('❌ publishPaths 不能为空；禁止无白名单发布。');
  process.exit(2);
}

const matchers = patterns.map((pattern) => globToRegExp(pattern.replaceAll('\\', '/')));
const changed = readChangedPaths();
const outside = changed.filter((file) => !matchers.some((matcher) => matcher.test(file)));

console.log(`发布范围配置：${path.relative(process.cwd(), configPath) || configPath}`);
console.log(`检测到变更：${changed.length} 个文件`);
console.log(`白名单条目：${patterns.length} 个`);
if (changed.length > 0) console.log(changed.map((file) => `  - ${file}`).join('\n'));

if (outside.length > 0) {
  console.error('\n❌ 以下文件不在 publishPaths 内：');
  console.error(outside.map((file) => `  - ${file}`).join('\n'));
  console.error('请更新发布范围或保留这些无关修改，不要使用 git add .。');
  process.exit(1);
}

console.log('\n✅ 发布范围通过；新增、修改和删除文件均受白名单约束。');
