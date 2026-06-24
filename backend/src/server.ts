import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { initChatSocket } from './sockets/chat';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import browseRoutes from './routes/browse';
import likesRoutes from './routes/likes';
import matchesRoutes from './routes/matches';
import verificationRoutes from './routes/verification';
import safetyRoutes from './routes/safety';
import premiumRoutes from './routes/premium';
import adminRoutes from './routes/admin';
import trustRoutes from './routes/trust';
import aiRoutes from './routes/ai';

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mockMode: {
    otp: process.env.MOCK_OTP !== 'false',
    aadhaar: process.env.MOCK_AADHAAR !== 'false',
    selfie: process.env.MOCK_SELFIE !== 'false',
    payments: process.env.MOCK_PAYMENTS !== 'false',
    ai: !process.env.OPENAI_API_KEY,
  }});
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/ai', aiRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

initChatSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`DateInIndia backend listening on http://localhost:${PORT}`);
  console.log(`Mock modes -> OTP:${process.env.MOCK_OTP !== 'false'} Aadhaar:${process.env.MOCK_AADHAAR !== 'false'} Selfie:${process.env.MOCK_SELFIE !== 'false'} Payments:${process.env.MOCK_PAYMENTS !== 'false'} AI:${!process.env.OPENAI_API_KEY}`);
});
