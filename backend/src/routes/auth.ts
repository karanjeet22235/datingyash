import { Router } from 'express';
import { prisma } from '../prisma';
import { sendOtp, verifyOtp } from '../services/otpService';
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshExpiryDate } from '../utils/jwt';
import { recalculateTrustScore } from '../services/trustScore';

const router = Router();

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || normalizePhone(phone).length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit Indian phone number required' });
    }
    const normalized = normalizePhone(phone);
    const result = await sendOtp(normalized);
    res.json({
      message: 'OTP sent',
      devMode: process.env.MOCK_OTP !== 'false',
      devOtp: result.devOtp, // present only in mock mode - shown directly so testers don't need an SMS
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
    const normalized = normalizePhone(phone);
    const valid = await verifyOtp(normalized, code);
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    let user = await prisma.user.findUnique({ where: { phone: normalized } });
    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({ data: { phone: normalized, phoneVerified: true } });
      isNewUser = true;
    } else if (!user.phoneVerified) {
      user = await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }

    if (user.isBanned) return res.status(403).json({ error: 'Account banned', reason: user.banReason });

    await recalculateTrustScore(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiryDate() },
    });

    res.json({
      accessToken,
      refreshToken,
      isNewUser,
      user: { id: user.id, phone: user.phone, name: user.name, profileComplete: !!user.name },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId });
    res.json({ accessToken });
  } catch (e: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
