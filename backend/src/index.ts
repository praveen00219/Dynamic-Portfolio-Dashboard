import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import portfolioRouter from './routes/portfolio.js';
import { requestLogger, notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/portfolio', portfolioRouter);

// Health check — useful for Docker/deployment readiness probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unmatched routes → typed 404 in the standard JSON envelope
app.use(notFoundHandler);

// Must be last — catches errors forwarded via next(error)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Portfolio API running on http://localhost:${PORT}`);
  console.log(`[Server] Accepting requests from ${FRONTEND_URL}`);
});