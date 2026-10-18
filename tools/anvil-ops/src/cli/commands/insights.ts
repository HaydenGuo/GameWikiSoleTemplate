import { collectInsights, formatInsights } from '../../core/insights.js';
import type { RunFn } from '../../core/content.js';
import type { GscCredential } from '../../core/env.js';
import type { GscClient } from '../../core/providers/gsc.js';

export async function insightsCommand(
  flags: {
    cwd?: string;
    days: number;
    run?: RunFn;
    gscClientFactory?: (o: { credential: GscCredential; siteUrl: string }) => GscClient;
  },
): Promise<number> {
  const report = await collectInsights({
    cwd: flags.cwd ?? process.cwd(),
    days: flags.days,
    run: flags.run,
    gscClientFactory: flags.gscClientFactory,
  });
  process.stdout.write(formatInsights(report.list, report.degraded, report.aio));
  return 0;
}
