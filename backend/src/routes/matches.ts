import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { isWithinNewMatchWindow } from '../services/safetyFilter';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      include: {
        userA: { include: { photos: true } },
        userB: { include: { photos: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = await Promise.all(matches.map(async (m) => {
      const other = m.userAId === req.userId ? m.userB : m.userA;
      const unreadCount = await prisma.message.count({
        where: { matchId: m.id, senderId: { not: req.userId }, readAt: null },
      });
      return {
        matchId: m.id,
        createdAt: m.createdAt,
        isNewMatchWindow: isWithinNewMatchWindow(m.createdAt),
        otherUser: {
          id: other.id,
          name: other.name,
          photos: other.photos.map((p) => ({ url: p.url, isPrimary: p.isPrimary })),
          trustScore: other.trustScore,
          isOnline: Date.now() - new Date(other.lastActiveAt).getTime() < 15 * 60 * 1000,
        },
        lastMessage: m.messages[0] || null,
        unreadCount,
      };
    }));

    res.json({ matches: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:matchId/messages', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const match = await prisma.match.findUnique({ where: { id: req.params.matchId } });
    if (!match || (match.userAId !== req.userId && match.userBId !== req.userId)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const messages = await prisma.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.message.updateMany({
      where: { matchId: match.id, senderId: { not: req.userId }, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({
      messages,
      isNewMatchWindow: isWithinNewMatchWindow(match.createdAt),
      safetyNotice: 'For your safety, avoid sharing phone numbers, UPI IDs, or moving to other apps until you feel comfortable. Never send money to someone you matched with online.',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
