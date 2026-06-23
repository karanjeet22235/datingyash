import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Public transparency report - powers the /trust page on the frontend.
router.get('/transparency', async (_req, res) => {
  const [
    totalUsers, verifiedUsers, bannedUsers, totalMessages, blockedMessages, totalReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { OR: [{ aadhaarVerified: true }, { selfieVerified: true }] } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.message.count(),
    prisma.message.count({ where: { blocked: true } }),
    prisma.report.count(),
  ]);

  res.json({
    asOf: new Date().toISOString(),
    totalUsers,
    verifiedUsers,
    verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    messagesScanned: totalMessages,
    messagesBlocked: blockedMessages,
    usersBanned: bannedUsers,
    reportsFiled: totalReports,
  });
});

export default router;
