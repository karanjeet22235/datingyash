// Real-time chat safety filter.
// Blocks scam / off-platform / payment-request patterns per spec.

export interface SafetyCheckResult {
  blocked: boolean;
  reason?: string;
  category?: 'phone' | 'upi' | 'off-platform' | 'money' | 'crypto' | 'cam' | 'investment' | 'scam';
  severity?: 'warn' | 'ban'; // ban = instant ban (money request / scam attempt)
}

const PHONE_REGEX = /\b[6-9]\d{9}\b/; // Indian 10-digit mobile pattern
const UPI_REGEX = /\b[0-9a-zA-Z.\-]+@(paytm|okaxis|okicici|okhdfcbank|ybl|upi)\b/i;
const OFF_PLATFORM_REGEX = /\b(whatsapp|whats app|telegram|instagram|insta\s?id|snapchat|snap\s?chat)\b/i;
const MONEY_REQUEST_REGEX = /\b(send money|transfer (amount|money|funds)|need (money|cash)|emergency fund|lend me|wire transfer|gpay me|paytm me|pay me|send (rs|inr|rupees|\$|usd))\b/i;
const CRYPTO_REGEX = /\b(bitcoin|btc|crypto|cryptocurrency|usdt|ethereum|eth wallet|binance|investment scheme)\b/i;
const CAM_REGEX = /\b(paid video call|cam show|webcam show|private show|nude (video|pic|photo))\b/i;
const INVESTMENT_REGEX = /\b(guaranteed return|double your money|guaranteed profit|forex trading tip|trading signal)\b/i;

export function checkMessageSafety(content: string): SafetyCheckResult {
  const text = content.trim();

  if (MONEY_REQUEST_REGEX.test(text)) {
    return { blocked: true, category: 'money', severity: 'ban', reason: 'Message appears to request money or funds transfer. This is not allowed and your account has been flagged.' };
  }
  if (CRYPTO_REGEX.test(text) || INVESTMENT_REGEX.test(text)) {
    return { blocked: true, category: 'crypto', severity: 'ban', reason: 'Message references cryptocurrency or investment schemes, which is a common scam pattern. Your account has been flagged.' };
  }
  if (CAM_REGEX.test(text)) {
    return { blocked: true, category: 'cam', severity: 'warn', reason: 'Message references paid video/cam content, which is not allowed on this platform.' };
  }
  if (UPI_REGEX.test(text)) {
    return { blocked: true, category: 'upi', severity: 'warn', reason: 'Sharing UPI / payment IDs is not allowed in chat for your safety.' };
  }
  if (PHONE_REGEX.test(text)) {
    return { blocked: true, category: 'phone', severity: 'warn', reason: 'Sharing phone numbers in chat is restricted for your safety. Please keep communication on the platform.' };
  }
  if (OFF_PLATFORM_REGEX.test(text)) {
    return { blocked: true, category: 'off-platform', severity: 'warn', reason: 'Suggesting to move the conversation off-platform is discouraged for your safety.' };
  }

  return { blocked: false };
}

// Extra rule: phone/UPI sharing entirely blocked for the first 7 days of a match,
// even softer mentions, handled by caller checking match age + calling this with stricter mode.
export function isWithinNewMatchWindow(matchCreatedAt: Date, days = 7): boolean {
  const ageMs = Date.now() - new Date(matchCreatedAt).getTime();
  return ageMs < days * 24 * 60 * 60 * 1000;
}
