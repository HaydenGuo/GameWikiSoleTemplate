import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { submit } from '../src/core/gitops.js';
import { defaultRun, type RunFn } from '../src/core/content.js';
import { OpsError } from '../src/core/errors.js';

interface Scripted {
  cmd: string;
  args: string[];
}

function scriptedRun(
  responses: (c: Scripted) => { status: number | null; stdout: string; stderr: string },
): RunFn & { calls: Scripted[] } {
  const calls: Scripted[] = [];
  const fn = ((cmd: string, args: string[], _opts: { cwd: string }) => {
    calls.push({ cmd, args });
    return responses({ cmd, args });
  }) as RunFn;
  (fn as unknown as { calls: Scripted[] }).calls = calls;
  return fn as RunFn & { calls: Scripted[] };
}

const ok = { status: 0, stdout: '', stderr: '' };

function tmpRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ops-gitops-unit-'));
  writeFileSync(join(dir, 'wrangler.toml'), '[vars]\nSITE_URL = "https://x.com"\n');
  return dir;
}

describe('submit orchestration', () => {
  it('no uncommitted changes -> OpsError, nothing else runs', async () => {
    const run = scriptedRun((c) => (c.args[0] === 'status' ? { ...ok, stdout: '' } : ok));
    await expect(submit({ cwd: tmpRepo(), run })).rejects.toMatchObject({ name: 'OpsError' });
    expect(run.calls).toHaveLength(1);
  });

  it('validation failure -> OpsError before any checkout', async () => {
    const run = scriptedRun((c) => {
      if (c.args[0] === 'status') return { ...ok, stdout: 'M file.mdx\n' };
      if (c.cmd === 'pnpm' && c.args[0] === 'check-content') return { status: 1, stdout: 'H1 found', stderr: '' };
      return ok;
    });
    await expect(submit({ cwd: tmpRepo(), run })).rejects.toMatchObject({ name: 'OpsError' });
    expect(run.calls.some((c) => c.args.includes('checkout'))).toBe(false);
  });

  it('happy path: branch, commit, push, gh pr create; PR body contains validation', async () => {
    const run = scriptedRun((c) => {
      if (c.args[0] === 'status') return { ...ok, stdout: 'M file.mdx\n' };
      if (c.cmd === 'gh') return { ...ok, stdout: 'https://github.com/o/r/pull/9\n' };
      return ok;
    });
    const r = await submit({ cwd: tmpRepo(), title: 'add boss guide', run });
    expect(r.branch).toMatch(/^ops\/submit-\d{8}-\d{4}$/);
    expect(r.prUrl).toBe('https://github.com/o/r/pull/9');
    const gh = run.calls.find((c) => c.cmd === 'gh')!;
    expect(gh.args[0]).toBe('pr');
    const body = gh.args[gh.args.indexOf('--body') + 1];
    expect(body).toContain('check-content');
    const push = run.calls.find((c) => c.args[0] === 'push')!;
    expect(push.args).toContain(r.branch);
  });
});

describe('submit integration (real git, local bare origin)', () => {
  it('creates branch, commits, pushes to origin; gh is faked', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ops-gitops-'));
    const origin = join(dir, 'origin.git');
    const work = join(dir, 'work');
    execSync(`git init -q -b main "${origin}" --bare`);
    execSync(`git init -q -b main "${work}"`);
    execSync(`git -C "${work}" config user.email t@t.t`);
    execSync(`git -C "${work}" config user.name t`);
    execSync(`git -C "${work}" remote add origin "${origin}"`);
    writeFileSync(join(work, 'wrangler.toml'), '[vars]\nSITE_URL = "https://x.com"\n');
    execSync(`git -C "${work}" add -A`);
    execSync(`git -C "${work}" commit -q -m init`);

    writeFileSync(join(work, 'new-article.mdx'), '---\ntitle: T\n---\nbody\n');

    const mixedRun: RunFn = (cmd, args, opts2) => {
      if (cmd === 'gh') return { status: 0, stdout: 'https://github.com/o/r/pull/1\n', stderr: '' };
      if (cmd === 'pnpm') return ok; // skip real validation in this git-flow test
      return defaultRun(cmd, args, opts2);
    };

    const r = await submit({ cwd: work, title: 'integration test', run: mixedRun });
    expect(r.prUrl).toContain('pull/1');
    const branches = execSync(`git --git-dir="${origin}" branch --list`).toString();
    expect(branches).toContain(r.branch);
  });
});
