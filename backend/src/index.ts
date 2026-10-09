import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { reportsRouter } from './routes/reports';
import { kelurahansRouter } from './routes/kelurahans';
import { statsRouter } from './routes/stats';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use(['/uploads', '/api/uploads'], express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (supports both /api/auth and /auth when rewritten by Vercel)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/reports', '/reports'], reportsRouter);
app.use(['/api/kelurahans', '/kelurahans'], kelurahansRouter);
app.use(['/api/stats', '/stats'], statsRouter);

// Error handler (must be last)
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  });
}

export default app;
