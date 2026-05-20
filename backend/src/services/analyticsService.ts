import { pool } from '../db/pool';

export interface IncomingEvent {
  event_type: string;
  properties?: Record<string, unknown>;
  // Client clock; we keep it on the row in `properties.client_ts` but the
  // authoritative `created_at` is the server timestamp.
  client_ts?: string;
}

const MAX_BATCH = 50;
const MAX_TYPE_LENGTH = 80;
const MAX_PROPERTIES_BYTES = 4 * 1024; // 4 KB per event keeps the table lean.

// Strict-but-permissive: tracking events should fail soft. We validate
// shape, sanitize, and silently drop bad rows rather than aborting the
// whole batch (we still record the rest).
export async function recordEvents(
  userId: string,
  events: IncomingEvent[],
): Promise<{ accepted: number; rejected: number }> {
  if (!Array.isArray(events) || events.length === 0) {
    return { accepted: 0, rejected: 0 };
  }
  const truncated = events.slice(0, MAX_BATCH);

  const consentOk = await hasResearchConsent(userId);
  if (!consentOk) {
    // Soft refusal: count as rejected so the client can throttle, but never
    // 4xx — we don't want analytics misconfiguration to surface as errors.
    return { accepted: 0, rejected: truncated.length };
  }

  const rows: { event_type: string; properties: string }[] = [];
  let rejected = 0;
  for (const event of truncated) {
    const type =
      typeof event.event_type === 'string'
        ? event.event_type.trim().slice(0, MAX_TYPE_LENGTH)
        : '';
    if (type.length === 0) {
      rejected += 1;
      continue;
    }
    const properties = event.properties && typeof event.properties === 'object' ? event.properties : {};
    const enriched = {
      ...properties,
      ...(event.client_ts ? { client_ts: event.client_ts } : {}),
    };
    let serialized: string;
    try {
      serialized = JSON.stringify(enriched);
    } catch {
      rejected += 1;
      continue;
    }
    if (Buffer.byteLength(serialized, 'utf8') > MAX_PROPERTIES_BYTES) {
      rejected += 1;
      continue;
    }
    rows.push({ event_type: type, properties: serialized });
  }

  if (rows.length === 0) {
    return { accepted: 0, rejected };
  }

  // Single multi-row INSERT — far cheaper than N round-trips.
  const placeholders: string[] = [];
  const values: unknown[] = [];
  rows.forEach((row, idx) => {
    const base = idx * 3;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}::jsonb)`);
    values.push(userId, row.event_type, row.properties);
  });
  await pool.query(
    `INSERT INTO analytics_events (user_id, event_type, properties)
     VALUES ${placeholders.join(', ')}`,
    values,
  );
  return { accepted: rows.length, rejected };
}

async function hasResearchConsent(userId: string): Promise<boolean> {
  const { rows } = await pool.query<{ research_consent: boolean }>(
    `SELECT research_consent FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0]?.research_consent === true;
}
