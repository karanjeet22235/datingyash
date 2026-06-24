// Simple "best match" heuristic scoring (no embeddings since no OpenAI key required).
// Scores shared interests, relationship goal match, same city, and trust score.

export function compatibilityScore(me: any, other: any): number {
  let score = 0;
  const myInterests: string[] = JSON.parse(me.interests || '[]');
  const otherInterests: string[] = JSON.parse(other.interests || '[]');
  const shared = myInterests.filter((i) => otherInterests.includes(i));
  score += shared.length * 10;

  if (me.relationshipGoal && me.relationshipGoal === other.relationshipGoal) score += 20;
  if (me.city && other.city && me.city.toLowerCase() === other.city.toLowerCase()) score += 15;
  if (me.religion && other.religion && me.religion === other.religion) score += 5;

  score += (other.trustScore || 0) * 0.2;

  const isOnlineRecently = Date.now() - new Date(other.lastActiveAt).getTime() < 15 * 60 * 1000;
  if (isOnlineRecently) score += 10;

  return score;
}
