import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { likeLimitForUser, superLikesPerDay } from '../services/trustScore';
import { publicUser } from './profile';

const router = Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.post('/:targetId/:action', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { targetId, action } = req.params;
    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    if (targetId === req.userId) return res.status(400).json({ error: 'Cannot like yourself' });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.isBanned) return res.status(404).json({ error: 'User not found' });

    const me = req.user;
    const today = startOfToday();

    if (action === 'like' || action === 'superlike') {
      const likeCountToday = await prisma.like.count({
        where: { fromUserId: req.userId, type: { in: ['like', 'superlike'] }, createdAt: { gte: today } },
      });
      const limit = likeLimitForUser(me);
      if (likeCountToday >= limit) {
        return res.status(429).json({ error: `Daily like limit reached (${limit}). Upgrade or verify your account for more.` });
      }
      if (action === 'superlike') {
        const superLimit = superLikesPerDay(me);
        const superCountToday = await prisma.like.count({
          where: { fromUserId: req.userId, type: 'superlike', createdAt: { gte: today } },
        });
        if (superLimit === 0) return res.status(403).json({ error: 'Super likes require Trust premium tier' });
        if (superCountToday >= superLimit) return res.status(429).json({ error: `Daily super like limit reached (${superLimit})` });
      }
    }

    const like = await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: req.userId!, toUserId: targetId } },
      update: { type: action },
      create: { fromUserId: req.userId!, toUserId: targetId, type: action },
    });

    let match = null;
    if (action === 'like' || action === 'superlike') {
      const mutual = await prisma.like.findFirst({
        where: { fromUserId: targetId, toUserId: req.userId, type: { in: ['like', 'superlike'] } },
      });
      if (mutual) {
        const [userAId, userBId] = [req.userId!, targetId].sort();
        match = await prisma.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          update: {},
          create: { userAId, userBId },
        });
      }
    }

    res.json({ like, match, isMatch: !!match });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/liked-you', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const likes = await prisma.like.findMany({
      where: { toUserId: req.userId, type: { in: ['like', 'superlike'] } },
      include: { fromUser: { include: { photos: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const myLikes = await prisma.like.findMany({ where: { fromUserId: req.userId }, select: { toUserId: true } });
    const alreadyLikedSet = new Set(myLikes.map((l) => l.toUserId));

    const me = req.user;
    const isPremium = me.premiumTier && me.premiumTier !== 'none';

    res.json({
      isPremium,
      likes: likes.map((l) => ({
        likeId: l.id,
        type: l.type,
        createdAt: l.createdAt,
        alreadyLikedBack: alreadyLikedSet.has(l.fromUserId),
        user: isPremium
          ? publicUser(l.fromUser, l.fromUser.photos)
          : { id: l.fromUser.id, blurred: true, trustScore: l.fromUser.trustScore }, // blurred for non-premium
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/daily-limit', requireAuth, async (req: AuthedRequest, res) => {
  const today = startOfToday();
  const used = await prisma.like.count({
    where: { fromUserId: req.userId, type: { in: ['like', 'superlike'] }, createdAt: { gte: today } },
  });
  const limit = likeLimitForUser(req.user);
  const superLimit = superLikesPerDay(req.user);
  res.json({ used, limit: limit === Infinity ? null : limit, superLikesPerDay: superLimit });
});

export default router;
