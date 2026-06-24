// Optional OpenAI-powered "AI Wingman" helper (bio suggestions / icebreakers).
// If OPENAI_API_KEY is unset, falls back to simple template-based logic so the
// app works fully without any AI dependency, per the spec.

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const FALLBACK_BIO_TEMPLATES = [
  "Exploring life one chai at a time. Love good food, deep conversations, and weekend getaways. Let's see where this goes!",
  "Foodie, traveler, and eternal optimist. Looking for someone who can match my energy and my love for bad puns.",
  "Work hard, dance harder. Big fan of monsoon walks and late-night conversations. Swipe right if you can keep up.",
];

const FALLBACK_ICEBREAKERS = [
  "If you could teleport to any city in India right now, where would you go?",
  "What's one food you could eat every day without getting bored?",
  "Beach vacation or mountain trek — and why?",
  "What's the most spontaneous thing you've ever done?",
];

export async function suggestBio(interests: string[]): Promise<string> {
  if (!OPENAI_KEY) {
    return FALLBACK_BIO_TEMPLATES[Math.floor(Math.random() * FALLBACK_BIO_TEMPLATES.length)];
  }
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write short, fun dating profile bios for an Indian dating app. Keep it under 280 characters.' },
          { role: 'user', content: `Write a dating bio for someone interested in: ${interests.join(', ') || 'meeting new people'}` },
        ],
        max_tokens: 100,
      }),
    });
    const data = (await resp.json()) as any;
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || FALLBACK_BIO_TEMPLATES[0];
  } catch (e) {
    console.warn('[AI] OpenAI call failed, using fallback bio template:', (e as Error).message);
    return FALLBACK_BIO_TEMPLATES[0];
  }
}

export async function suggestIcebreaker(otherUserInterests: string[]): Promise<string> {
  if (!OPENAI_KEY) {
    return FALLBACK_ICEBREAKERS[Math.floor(Math.random() * FALLBACK_ICEBREAKERS.length)];
  }
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write a single short, fun icebreaker question for a dating app chat.' },
          { role: 'user', content: `The other person likes: ${otherUserInterests.join(', ') || 'general topics'}. Suggest one icebreaker question.` },
        ],
        max_tokens: 60,
      }),
    });
    const data = (await resp.json()) as any;
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || FALLBACK_ICEBREAKERS[0];
  } catch (e) {
    console.warn('[AI] OpenAI call failed, using fallback icebreaker:', (e as Error).message);
    return FALLBACK_ICEBREAKERS[0];
  }
}
