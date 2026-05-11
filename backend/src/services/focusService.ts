// Pomodoro / deep-work sessions and aggregate stats.

export async function recordSession(
  _userId: string,
  _input: { durationMinutes: number; rating?: number },
): Promise<never> {
  throw new Error('focusService.recordSession not implemented');
}

export async function listSessions(_userId: string): Promise<never> {
  throw new Error('focusService.listSessions not implemented');
}

export async function computeStats(_userId: string): Promise<never> {
  throw new Error('focusService.computeStats not implemented');
}
