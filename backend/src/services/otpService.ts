// Pluggable OTP service.
// In dev/mock mode (default), OTP is generated locally, logged to console, and
// also returned in the API response so the flow is testable without SMS costs.
// Set MOCK_OTP=false and provide MSG91 credentials to use real SMS in production.

import { prisma } from '../prisma';

const MOCK_MODE = (process.env.MOCK_OTP ?? 'true') !== 'false';
const OTP_TTL_MS = 5 * 60 * 1000;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<{ devOtp?: string }> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otp.create({ data: { phone, code, expiresAt } });

  if (MOCK_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[MOCK OTP] Phone ${phone} -> OTP code: ${code} (expires in 5 min)`);
    return { devOtp: code };
  }

  // Real MSG91 integration would go here.
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    console.warn('[OTP] MOCK_OTP=false but MSG91 credentials missing; falling back to mock console log.');
    console.log(`[MOCK OTP fallback] Phone ${phone} -> OTP code: ${code}`);
    return { devOtp: code };
  }

  try {
    await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: authKey },
      body: JSON.stringify({ template_id: templateId, mobile: phone, otp: code }),
    });
  } catch (err) {
    console.error('[OTP] MSG91 send failed, OTP still stored for verification:', err);
  }
  return {};
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: { phone, code, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return false;
  await prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } });
  return true;
}
