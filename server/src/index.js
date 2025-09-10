import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import neonAuthRoutes from './routes/neonAuth.js';
import guestRoutes from './routes/guest.js';
import adminRoutes from './routes/admin.js';

// Validate required environment variables (only essential ones)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Set default PROJECT_ID if not provided
if (!process.env.PROJECT_ID) {
  process.env.PROJECT_ID = 'hotel-management-system';
}

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

console.log('✅ All required environment variables are present');

const app = express();

// CORS: support single or comma-separated origins via CORS_ORIGIN
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow same-origin/non-browser requests
    // Dev convenience: allow any localhost origin
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || isLocalhost) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/neon-auth', neonAuthRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 API listening on http://localhost:${port}`));
