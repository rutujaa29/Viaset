import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import companiesRoutes from './routes/companies.js';
import exportRoutes from './routes/export.js';
import savedSearchesRoutes from './routes/saved-searches.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import bookmarksRoutes from './routes/bookmarks.js';
import notesRoutes from './routes/notes.js';
import comparisonRoutes from './routes/comparison.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Supply-Chain Intelligence API listening on http://localhost:${config.port}`);
});
