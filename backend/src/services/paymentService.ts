// Pluggable payments service.
// Real flow uses Razorpay order creation + checkout + webhook verification.
// In mock mode (default, MOCK_PAYMENTS=true) we expose a "fake checkout" that
// immediately marks the subscription as paid so the premium flow is fully
// testable locally without Razorpay keys.

import crypto from 'crypto';

const MOCK_MODE = (process.env.MOCK_PAYMENTS ?? 'true') !== 'false';

export const TIER_PRICING: Record<string, { amount: number; label: string }> = {
  basic: { amount: 14900, label: 'Basic - ₹149/mo' },
  standard: { amount: 29900, label: 'Standard - ₹299/mo' },
  trust: { amount: 39900, label: 'Trust - ₹399/mo' },
};

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  mock: boolean;
  keyId?: string;
}

export async function createOrder(tier: string): Promise<OrderResult> {
  const pricing = TIER_PRICING[tier];
  if (!pricing) throw new Error('Invalid tier');

  if (MOCK_MODE) {
    return {
      orderId: `mock_order_${crypto.randomBytes(8).toString('hex')}`,
      amount: pricing.amount,
      currency: 'INR',
      mock: true,
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.warn('[Payments] MOCK_PAYMENTS=false but Razorpay credentials missing; falling back to mock order.');
    return {
      orderId: `mock_order_${crypto.randomBytes(8).toString('hex')}`,
      amount: pricing.amount,
      currency: 'INR',
      mock: true,
    };
  }

  // Real Razorpay order creation (shape kept ready for production):
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: pricing.amount, currency: 'INR', payment_capture: 1 }),
  });
  const data = (await resp.json()) as any;
  return { orderId: data.id, amount: pricing.amount, currency: 'INR', mock: false, keyId };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}
