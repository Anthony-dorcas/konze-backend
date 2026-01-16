// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth/index.js';


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(express.json({ limit: '10mb' }));

// Allow requests from ANY domain (very permissive - good only for development)
app.use(cors({
  origin: true,                    // ← reflects the requesting origin (allows all)
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Some people prefer this even more permissive variant:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');          // ← allows literally everyone
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// =============================================
// ROUTES
// =============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/api', authRoutes);  // optional

// =============================================
// START SERVER
// =============================================
app.listen(port, () => {
  console.log(`╔═══════════════════════════════════════╗`);
  console.log(`║ Server running on port ${port}         ║`);
  console.log(`║ Environment: ${process.env.NODE_ENV || 'development'} ║`);
  console.log(`╚═══════════════════════════════════════╝`);
});