import cron from 'node-cron';

// Scheduled work: daily streak rollover, pet stat decay, scheduled notifications.
// Jobs are registered on boot; their bodies are placeholders pending the next prompt.

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  // Daily rollover at 00:05 UTC. Will move to per-user-local windows later.
  cron.schedule('5 0 * * *', () => {
    try {
      runDailyRollover();
    } catch (err) {
      console.error('Daily rollover failed:', err);
    }
  });
}

export function runDailyRollover(): void {
  throw new Error('cronService.runDailyRollover not implemented');
}
