import path from 'node:path';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import {
  requireAdmin,
  signAdminToken,
  verifyAdminCredentials,
} from './auth';
import {
  getRows,
  getTableCount,
  getTableSpec,
  listTables,
  type DateFilter,
} from './queries';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

const dateFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

function parseFilter(query: Request['query']): DateFilter {
  const parsed = dateFilterSchema.parse(query);
  return {
    from: parsed.from ?? null,
    to: parsed.to ?? null,
    limit: parsed.limit ?? 100,
    offset: parsed.offset ?? 0,
  };
}

export function createPortalApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  // No CORS with the main app. The portal is self-contained.
  app.use(cors({ origin: false }));
  app.use(express.json({ limit: '64kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/research/auth/login', async (req: Request, res: Response) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Invalid login payload.' } });
      return;
    }
    const admin = await verifyAdminCredentials(body.data.email, body.data.password);
    if (!admin) {
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }
    const token = signAdminToken(admin.id, admin.email);
    res.json({ token, admin: { id: admin.id, email: admin.email, display_name: admin.display_name } });
  });

  app.get('/api/research/me', requireAdmin, (req: Request, res: Response) => {
    res.json({ id: req.adminId, email: req.adminEmail });
  });

  app.get('/api/research/tables', requireAdmin, async (_req: Request, res: Response) => {
    const tables = listTables();
    const enriched = await Promise.all(
      tables.map(async (t) => ({ ...t, count: await getTableCount(t.key) })),
    );
    res.json({ tables: enriched });
  });

  app.get('/api/research/data/:table', requireAdmin, async (req: Request, res: Response) => {
    try {
      const filter = parseFilter(req.query);
      const result = await getRows(req.params.table, filter);
      res.json({ ...result, limit: filter.limit, offset: filter.offset });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Invalid query parameters.' } });
        return;
      }
      const msg = err instanceof Error ? err.message : 'unknown';
      res.status(404).json({ error: { code: 'NOT_FOUND', message: msg } });
    }
  });

  app.get('/api/research/export/:table', requireAdmin, async (req: Request, res: Response) => {
    try {
      const tableKey = req.params.table;
      const spec = getTableSpec(tableKey);
      if (!spec) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown table.' } });
        return;
      }

      // No client-controlled offset on exports: dump the whole filtered set.
      const filter: DateFilter = {
        from: typeof req.query.from === 'string' ? req.query.from : null,
        to: typeof req.query.to === 'string' ? req.query.to : null,
        limit: 1_000_000,
        offset: 0,
      };
      const { columns, rows } = await getRows(tableKey, filter);

      const stamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="kyndill-${tableKey}-${stamp}.csv"`,
      );
      res.write(columns.map(csvEscape).join(',') + '\n');
      for (const row of rows) {
        res.write(columns.map((c) => csvEscape(row[c])).join(',') + '\n');
      }
      res.end();
    } catch {
      res.status(500).json({ error: { code: 'EXPORT_FAILED', message: 'Could not export.' } });
    }
  });

  // Static UI. Plain HTML + vanilla JS — smaller attack surface than React.
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir, { extensions: ['html'] }));
  // SPA fallback for actual page routes only. Anything that looks like an
  // asset (has a dot in the path) returns a real 404 — never lies about its
  // content type by sending index.html.
  app.get('*', (req: Request, res: Response) => {
    if (req.path.includes('.')) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
