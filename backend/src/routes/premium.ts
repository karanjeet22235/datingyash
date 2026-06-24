import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { createOrder, verifyRazorpaySignature, TIER_PRICING } from '../services/paymentService';

const router = Router();

router.get('/tiers', (_req, res) => {
  res.json({
    tiers: [
      { id: 'basic', name: 'Basic', price: TIER_PRICING.basic.amount / 100, period: 'month', features: ['See who liked you', '50 likes/day', 'Read receipts', 'Ad-free'] },
      { id: 'standard', name: 'Standard', price: TIER_PRICING.standard.amount / 100, period: 'month', features: ['Everything in Basic', 'Unlimited likes', 'Advanced filters', 'Weekly boost', 'Voice notes'] },
      { id: 'trust', name: 'Trust', price: TIER_PRICING.trust.amount / 100, period: 'month', features: ['Everything in Standard', 'Human-verified badge', 'Priority support', 'AI wingman', '3 super likes/day', 'Profile visitors'] },
    ],
  });
});

router.post('/checkout/order', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { tier } = req.body;
    if (!TIER_PRICING[tier]) return res.status(400).json({ error: 'Invalid tier' });

    const order = await createOrder(tier);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sub = await prisma.subscription.create({
      data: {
        userId: req.userId!, tier, amount: order.amount, status: 'created',
        razorpayOrderId: order.orderId, expiresAt,
      },
    });

    res.json({ subscriptionId: sub.id, order, razorpayKeyId: order.keyId || null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Real Razorpay verification endpoint (used when MOCK_PAYMENTS=false)
router.post('/checkout/verify', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { subscriptionId, razorpayPaymentId, razorpaySignature } = req.body;
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.userId !== req.userId) return res.status(404).json({ error: 'Subscription not found' });

    const valid = verifyRazorpaySignature(sub.razorpayOrderId!, razorpayPaymentId, razorpaySignature);
    if (!valid) return res.status(400).json({ error: 'Payment signature verification failed' });

    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'paid', razorpayPaymentId } });
    await prisma.user.update({ where: { id: req.userId }, data: { premiumTier: sub.tier, premiumExpiresAt: sub.expiresAt } });

    res.json({ message: 'Subscription activated', tier: sub.tier });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Fake checkout for local dev/testing - instantly marks subscription paid + user premium.
// Only meaningful when MOCK_PAYMENTS=true (default in dev).
router.post('/checkout/fake-complete', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (process.env.MOCK_PAYMENTS === 'false') {
      return res.status(403).json({ error: 'Fake checkout disabled (MOCK_PAYMENTS=false). Use real Razorpay flow.' });
    }
    const { subscriptionId } = req.body;
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.userId !== req.userId) return res.status(404).json({ error: 'Subscription not found' });

    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'paid', razorpayPaymentId: `mock_pay_${sub.id}` } });
    await prisma.user.update({ where: { id: req.userId }, data: { premiumTier: sub.tier, premiumExpiresAt: sub.expiresAt } });

    res.json({ message: `Mock checkout complete - you are now ${sub.tier} tier`, tier: sub.tier });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/my-subscription', requireAuth, async (req: AuthedRequest, res) => {
  res.json({ premiumTier: req.user.premiumTier, premiumExpiresAt: req.user.premiumExpiresAt });
});

export default router;
