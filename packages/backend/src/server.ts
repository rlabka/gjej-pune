import './config/env';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes';
import { initWebSocket } from './websocket';

const app = express();
const server = http.createServer(app);

// ─── WebSocket ──────────────────────────────────────────
initWebSocket(server);

// ─── Security ───────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Disable headers that nginx already handles (avoids duplicates/conflicts)
  contentSecurityPolicy: false,
  strictTransportSecurity: false,
  xFrameOptions: false,
  xContentTypeOptions: false,
  xXssProtection: false,
  referrerPolicy: false,
}));
app.use(cors({
  origin: env.IS_PRODUCTION
    ? [env.FRONTEND_URL, env.FRONTEND_URL.replace('://', '://www.')]
    : [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// ─── Stripe Webhook (raw body – must be before express.json) ──
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// ─── Apple IAP Webhook (raw body, 1MB limit for large JWS payloads) ──
// Must be before express.json() — Apple's notification payloads can
// exceed the default 100KB body limit when they carry transaction
// history.
app.use('/api/iap/apple-webhook', express.raw({ type: 'application/json', limit: '1mb' }));

// ─── Body Parsing ───────────────────────────────────────
app.use(express.json());

// ─── Static Files (uploads) ─────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ─── Routes ─────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Health Check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ───────────────────────────────────────
server.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
  console.log(`   WebSocket path: /ws`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

export default app;
