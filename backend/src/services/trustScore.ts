import { prisma } from '../prisma';

// Trust score formula per spec:
// phone verified +10, aadhaar verified +30, selfie verified +20,
// profile >80% complete +10, active 3+ months +10, positive ratings up to +15,
// zero reports +5 (max 100). Harassment report -30 (handled at report-time elsewhere if desired).
export async function computeProfileCompleteness(user: any): Promise<number> {
  const fields = [
    user.name, user.dob, user.gender, user.lookingFor, user.city, user.state,
    user.bio, user.jobTitle, user.education, user.height, user.religion,
    user.relationshipGoal,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== '').length;
  const interests = JSON.parse(user.interests || '[]');
  const prompts = JSON.parse(user.prompts || '[]');
  const photoCount = await prisma.photo.count({ where: { userId: user.id } });

  let score = filled / fields.length; // 0..1 from basic fields
  if (interests.length >= 3) score += 0.1;
  if (prompts.length >= 1) score += 0.1;
  if (photoCount >= 2) score += 0.1;
  return Math.min(1, score) * 100;
}

export async function recalculateTrustScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  let score = 0;
  if (user.phoneVerified) score += 10;
  if (user.aadhaarVerified) score += 30;
  if (user.selfieVerified) score += 20;

  const completeness = await computeProfileCompleteness(user);
  if (completeness > 80) score += 10;

  const monthsActive = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsActive >= 3) score += 10;

  // Positive ratings placeholder: derive a simple proxy from lack of reports (no explicit rating model in spec scope)
  const reportCount = await prisma.report.count({ where: { reportedId: userId } });
  if (reportCount === 0) score += 5;
  else score -= 0; // reports already penalized via applyReportPenalty

  // Positive ratings up to +15 - approximate using inverse of strikes (no rating table implemented)
  const positiveRatingBonus = Math.max(0, 15 - user.strikes * 5);
  score += Math.min(15, positiveRatingBonus);

  score = Math.max(0, Math.min(100, score));

  await prisma.user.update({ where: { id: userId }, data: { trustScore: score } });
  return score;
}

export async function applyHarassmentPenalty(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { trustScore: { decrement: 30 } },
  });
  if (user.trustScore < 0) await prisma.user.update({ where: { id: userId }, data: { trustScore: 0 } });
  return user;
}

export async function banUser(userId: string, reason: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banReason: reason, trustScore: 0 },
  });
}

export async function applyMultipleReportsPenalty(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { trustScore: { decrement: 50 } },
  });
  if (user.trustScore < 0) await prisma.user.update({ where: { id: userId }, data: { trustScore: 0 } });
  return user;
}

export function likeLimitForUser(user: any): number {
  if (user.premiumTier !== 'none' && user.premiumTier !== null) {
    if (user.premiumTier === 'standard' || user.premiumTier === 'trust') return Infinity;
    if (user.premiumTier === 'basic') return 50;
  }
  if (user.aadhaarVerified) return 25;
  if (user.phoneVerified) return 10;
  return 5;
}

export function superLikesPerDay(user: any): number {
  if (user.premiumTier === 'trust') return 3;
  return 0;
}
