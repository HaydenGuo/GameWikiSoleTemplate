import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

export type OffloadMessage =
  | { kind: 'audit'; cwd: string }
  | { kind: 'submit'; cwd: string; title?: string; base?: string };

export type OffloadResult = { ok: true; text: string } | { ok: false; errorText: string };

const workerUrl = new URL('./worker.js', import.meta.url);

/**
 * True when the compiled worker exists (i.e. running from dist/). In source
 * form (vitest) there is no worker.js — callers fall back to in-process runs,
 * which also keeps injected test deps (opts.run) effective.
 */
export function canOffload(): boolean {
  return existsSync(fileURLToPath(workerUrl));
}

/**
 * Run the spawn-heavy tools (audit / submit_pr) in a worker thread.
 *
 * Why: the core runs `pnpm build` etc. through spawnSync, which blocks the
 * Node event loop for the whole run — on the MCP stdio server that freezes
 * EVERY request (including keepalive pings) for minutes, and clients with
 * ~60s timeouts cancel the call even though the work is progressing. A
 * worker thread keeps the loop responsive with zero changes to the (sync,
 * well-tested) core.
 */
export function offload(msg: OffloadMessage): Promise<OffloadResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { workerData: msg });
    worker.once('message', (result: OffloadResult) => {
      void worker.terminate();
      resolve(result);
    });
    worker.once('error', (err) => {
      reject(err);
    });
  });
}
