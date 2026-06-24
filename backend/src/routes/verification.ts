import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { verifyAadhaar } from '../services/aadhaarService';
import { verifySelfie } from '../services/selfieService';
import { recalculateTrustScore } from '../services/trustScore';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/status', requireAuth, async (req: AuthedRequest, res) => {
  const records = await prisma.verification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  res.json({
    phoneVerified: req.user.phoneVerified,
    aadhaarVerified: req.user.aadhaarVerified,
    selfieVerified: req.user.selfieVerified,
    trustScore: req.user.trustScore,
    history: records,
  });
});

// Mock DigiLocker-style Aadhaar verification: user confirms name + DOB, we never
// ask for or store the Aadhaar number itself (DPDP compliance).
router.post('/aadhaar', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { fullName, dob } = req.body;
    if (!fullName || !dob) return res.status(400).json({ error: 'fullName and dob required' });

    const result = await verifyAadhaar({ fullName, dob });

    await prisma.verification.create({
      data: {
        userId: req.userId!,
        type: 'aadhaar',
        status: result.approved ? 'approved' : 'rejected',
        meta: JSON.stringify({ provider: result.provider, nameConfirmed: fullName, dobConfirmed: dob }),
      },
    });

    if (result.approved) {
      await prisma.user.update({ where: { id: req.userId }, data: { aadhaarVerified: true } });
      await recalculateTrustScore(req.userId!);
    }

    res.json({ approved: result.approved, message: result.message });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Mock HyperVerge-style selfie liveness verification.
router.post('/selfie', requireAuth, upload.single('selfie'), async (req: AuthedRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No selfie uploaded' });

    const result = await verifySelfie(req.file.path);

    await prisma.verification.create({
      data: {
        userId: req.userId!,
        type: 'selfie',
        status: result.approved ? 'approved' : 'rejected',
        meta: JSON.stringify({ provider: result.provider, filename: req.file.filename }),
      },
    });

    if (result.approved) {
      await prisma.user.update({ where: { id: req.userId }, data: { selfieVerified: true } });
      await recalculateTrustScore(req.userId!);
    }

    res.json({ approved: result.approved, message: result.message });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
