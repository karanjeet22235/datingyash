import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { applyHarassmentPenalty, applyMultipleReportsPenalty, banUser, recalculateTrustScore } from '../services/trustScore';

const router = Router();

const VALID_REASONS = ['harassment', 'fake_profile', 'inappropriate_content', 'scam_attempt', 'underage', 'other'];

router.post('/report', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { reportedId, reason, details } = req.body;
    if (!reportedId || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}` });
    }
    if (reportedId === req.userId) return res.status(400).json({ error: 'Cannot report yourself' });

    const report = await prisma.report.create({
      data: { reporterId: req.userId!, reportedId, reason, details },
    });

    if (reason === 'harassment') {
      await applyHarassmentPenalty(reportedId);
    }
    if (reason === 'scam_attempt') {
      await banUser(reportedId, 'Scam attempt reported and confirmed pattern');
    }

    const reportCount = await prisma.report.count({ where: { reportedId } });
    if (reportCount >= 3) {
      await applyMultipleReportsPenalty(reportedId);
      // flagged for human review - status stays pending, admin queue will show it
    }
    await recalculateTrustScore(reportedId);

    res.json({ message: 'Report submitted', report });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/block', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { blockedId } = req.body;
    if (!blockedId || blockedId === req.userId) return res.status(400).json({ error: 'Invalid blockedId' });

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId } },
      update: {},
      create: { blockerId: req.userId!, blockedId },
    });

    res.json({ message: 'User blocked' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/unblock', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { blockedId } = req.body;
    await prisma.block.deleteMany({ where: { blockerId: req.userId, blockedId } });
    res.json({ message: 'User unblocked' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/blocked', requireAuth, async (req: AuthedRequest, res) => {
  const blocks = await prisma.block.findMany({ where: { blockerId: req.userId }, include: { blocked: true } });
  res.json({ blocked: blocks.map((b) => ({ id: b.blocked.id, name: b.blocked.name })) });
});

export default router;
