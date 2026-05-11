// Habit CRUD, completion, and streak recalculation.
// See docs/DATABASE.md for the underlying schema.

export async function listForUser(_userId: string): Promise<never> {
  throw new Error('habitService.listForUser not implemented');
}

export async function create(_userId: string, _input: unknown): Promise<never> {
  throw new Error('habitService.create not implemented');
}

export async function getById(_userId: string, _habitId: string): Promise<never> {
  throw new Error('habitService.getById not implemented');
}

export async function update(_userId: string, _habitId: string, _patch: unknown): Promise<never> {
  throw new Error('habitService.update not implemented');
}

export async function archive(_userId: string, _habitId: string): Promise<never> {
  throw new Error('habitService.archive not implemented');
}

export async function complete(_userId: string, _habitId: string): Promise<never> {
  throw new Error('habitService.complete not implemented');
}

export async function listCompletions(
  _userId: string,
  _habitId: string,
  _range?: { from?: string; to?: string },
): Promise<never> {
  throw new Error('habitService.listCompletions not implemented');
}
