import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { upload, uploadDirPath } from '../middleware/upload';
import { recalculateTrustScore } from '../services/trustScore';
import path from 'path';
import fs from 'fs';

const router = Router();

function publicUser(user: any, photos: any[] = []) {
  return {
    id: user.id,
    name: user.name,
    dob: user.dob,
    gender: user.gender,
    lookingFor: user.lookingFor,
    city: user.city,
    state: user.state,
    bio: user.bio,
    jobTitle: user.jobTitle,
    company: user.company,
    education: user.education,
    height: user.height,
    religion: user.religion,
    relationshipGoal: user.relationshipGoal,
    interests: JSON.parse(user.interests || '[]'),
    prompts: JSON.parse(user.prompts || '[]'),
    phoneVerified: user.phoneVerified,
    aadhaarVerified: user.aadhaarVerified,
    selfieVerified: user.selfieVerified,
    trustScore: user.trustScore,
    premiumTier: user.premiumTier,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    photos: photos.map((p) => ({ id: p.id, url: p.url, isPrimary: p.isPrimary })),
  };
}

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const photos = await prisma.photo.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } });
  res.json({ user: { ...publicUser(req.user, photos), phone: req.user.phone, isAdmin: req.user.isAdmin } });
});

router.put('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {
      name, dob, gender, lookingFor, city, state, bio, jobTitle, company,
      education, height, religion, relationshipGoal, interests, prompts,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (dob !== undefined) data.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) data.gender = gender;
    if (lookingFor !== undefined) data.lookingFor = lookingFor;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (bio !== undefined) data.bio = bio;
    if (jobTitle !== undefined) data.jobTitle = jobTitle;
    if (company !== undefined) data.company = company;
    if (education !== undefined) data.education = education;
    if (height !== undefined) data.height = height;
    if (religion !== undefined) data.religion = religion;
    if (relationshipGoal !== undefined) data.relationshipGoal = relationshipGoal;
    if (interests !== undefined) data.interests = JSON.stringify(interests);
    if (prompts !== undefined) data.prompts = JSON.stringify(prompts);

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    await recalculateTrustScore(user.id);
    const photos = await prisma.photo.findMany({ where: { userId: req.userId } });
    res.json({ user: publicUser(user, photos) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/me/photos', requireAuth, upload.single('photo'), async (req: AuthedRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const existingCount = await prisma.photo.count({ where: { userId: req.userId } });
    const photo = await prisma.photo.create({
      data: {
        userId: req.userId!,
        url: `/uploads/${req.file.filename}`,
        isPrimary: existingCount === 0,
      },
    });
    await recalculateTrustScore(req.userId!);
    res.json({ photo });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/me/photos/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo || photo.userId !== req.userId) return res.status(404).json({ error: 'Photo not found' });

    const filePath = path.join(uploadDirPath, path.basename(photo.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.photo.delete({ where: { id: photo.id } });
    await recalculateTrustScore(req.userId!);
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/me/photos/:id/primary', requireAuth, async (req: AuthedRequest, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo || photo.userId !== req.userId) return res.status(404).json({ error: 'Photo not found' });

  await prisma.photo.updateMany({ where: { userId: req.userId }, data: { isPrimary: false } });
  await prisma.photo.update({ where: { id: photo.id }, data: { isPrimary: true } });
  res.json({ message: 'Updated' });
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: req.userId, blockedId: user.id },
        { blockerId: user.id, blockedId: req.userId },
      ],
    },
  });
  if (blocked) return res.status(403).json({ error: 'Profile unavailable' });

  const photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  res.json({ user: publicUser(user, photos) });
});

router.delete('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    // DPDP-compliant account deletion: hard delete user + cascades (photos, likes,
    // matches, messages, reports, blocks, subscriptions, verifications, tokens, otps)
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: 'Account permanently deleted' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
export { publicUser };
