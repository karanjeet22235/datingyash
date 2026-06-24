import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { compatibilityScore } from '../services/matching';
import { publicUser } from './profile';

const router = Router();

function ageFromDob(dob: Date | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {
      minAge, maxAge, city, state, lookingFor, religion,
      verifiedOnly, onlineOnly, sort = 'newest', page = '1', limit = '20',
    } = req.query as Record<string, string>;

    const blockedByMe = await prisma.block.findMany({ where: { blockerId: req.userId }, select: { blockedId: true } });
    const blockedMe = await prisma.block.findMany({ where: { blockedId: req.userId }, select: { blockerId: true } });
    const excludeIds = new Set<string>([
      req.userId!,
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    const swiped = await prisma.like.findMany({ where: { fromUserId: req.userId }, select: { toUserId: true } });
    swiped.forEach((s) => excludeIds.add(s.toUserId));

    const where: any = {
      id: { notIn: Array.from(excludeIds) },
      isBanned: false,
      name: { not: null },
    };
    if (city) where.city = { equals: city, mode: undefined };
    if (state) where.state = { equals: state };
    if (lookingFor) where.gender = lookingFor; // looking-for filter matches other users' gender
    if (religion) where.religion = religion;
    if (verifiedOnly === 'true') {
      where.OR = [{ aadhaarVerified: true }, { selfieVerified: true }];
    }

    let users = await prisma.user.findMany({ where, include: { photos: true } });

    // Age filter (computed, since SQLite can't filter on derived age directly)
    if (minAge || maxAge) {
      users = users.filter((u) => {
        const age = ageFromDob(u.dob);
        if (age === null) return false;
        if (minAge && age < parseInt(minAge, 10)) return false;
        if (maxAge && age > parseInt(maxAge, 10)) return false;
        return true;
      });
    }

    if (onlineOnly === 'true') {
      users = users.filter((u) => Date.now() - new Date(u.lastActiveAt).getTime() < 15 * 60 * 1000);
    }

    const me = req.user;
    if (sort === 'online') {
      users.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    } else if (sort === 'best-match') {
      users.sort((a, b) => compatibilityScore(me, b) - compatibilityScore(me, a));
    } else {
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 20);
    const total = users.length;
    const paged = users.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      users: paged.map((u) => ({
        ...publicUser(u, u.photos),
        isOnline: Date.now() - new Date(u.lastActiveAt).getTime() < 15 * 60 * 1000,
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
