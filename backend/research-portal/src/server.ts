import 'dotenv/config';
import { createPortalApp } from './app';

const port = Number(process.env.RESEARCH_PORT ?? 4001);

const app = createPortalApp();
app.listen(port, () => {
  console.log(`[research-portal] listening on http://localhost:${port}`);
});
