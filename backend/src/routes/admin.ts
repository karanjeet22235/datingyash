import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { banUser, recalculateTrustScore } from '../services/trustScore';

const router = Router();

router.use(requireAdmin);

router.get('/users', async (req, res) => {
  const { page = '1', limit = '50', search } = req.query as Record<string, string>;
  const where: any = {};
  if (search) {
    where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
  }
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' },
      select: {
        id: true, phone: true, name: true, city: true, trustScore: true, strikes: true,
        isBanned: true, premiumTier: true, phoneVerified: true, aadhaarVerified: true,
        selfieVerified: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, pagination: { page: pageNum, limit: limitNum, total } });
});

router.post('/users/:id/ban', async (req, res) => {
  const { reason } = req.body;
  const user = await banUser(req.params.id, reason || 'Banned by admin');
  res.json({ message: 'User banned', user: { id: user.id, isBanned: user.isBanned } });
});

router.post('/users/:id/unban', async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: false, banReason: null } });
  await recalculateTrustScore(user.id);
  res.json({ message: 'User unbanned' });
});

router.get('/reports', async (req, res) => {
  const { status = 'pending' } = req.query as Record<string, string>;
  const reports = await prisma.report.findMany({
    where: status === 'all' ? {} : { status },
    include: { reporter: { select: { id: true, name: true, phone: true } }, reported: { select: { id: true, name: true, phone: true, trustScore: true, strikes: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reports });
});

router.post('/reports/:id/resolve', async (req, res) => {
  const { resolution, action } = req.body; // action: dismiss, ban, warn
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: 'resolved', resolution: resolution || action },
  });
  if (action === 'ban') {
    await banUser(report.reportedId, `Banned via report resolution: ${report.reason}`);
  } else if (action === 'warn') {
    await prisma.user.update({ where: { id: report.reportedId }, data: { strikes: { increment: 1 } } });
    await recalculateTrustScore(report.reportedId);
  }
  res.json({ message: 'Report resolved', report });
});

router.get('/verification-queue', async (req, res) => {
  const verifications = await prisma.verification.findMany({
    where: { status: 'pending' },
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ verifications });
});

router.get('/analytics', async (_req, res) => {
  const [
    totalUsers, verifiedUsers, bannedUsers, totalMatches, totalMessages,
    blockedMessages, pendingReports, premiumUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { OR: [{ aadhaarVerified: true }, { selfieVerified: true }] } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.match.count(),
    prisma.message.count(),
    prisma.message.count({ where: { blocked: true } }),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.user.count({ where: { premiumTier: { not: 'none' } } }),
  ]);
  res.json({
    totalUsers, verifiedUsers, bannedUsers, totalMatches, totalMessages,
    blockedMessages, pendingReports, premiumUsers,
  });
});

export default router;
