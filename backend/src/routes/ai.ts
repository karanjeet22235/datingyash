import { Router } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { suggestBio, suggestIcebreaker } from '../services/aiService';

const router = Router();

router.post('/suggest-bio', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const interests: string[] = JSON.parse(req.user.interests || '[]');
    const bio = await suggestBio(interests);
    res.json({ bio, aiPowered: !!process.env.OPENAI_API_KEY });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/icebreaker/:matchUserId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { prisma } = await import('../prisma');
    const other = await prisma.user.findUnique({ where: { id: req.params.matchUserId } });
    const interests: string[] = other ? JSON.parse(other.interests || '[]') : [];
    const icebreaker = await suggestIcebreaker(interests);
    res.json({ icebreaker, aiPowered: !!process.env.OPENAI_API_KEY });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
