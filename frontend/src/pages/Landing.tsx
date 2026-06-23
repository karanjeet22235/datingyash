import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const TRUST_MESSAGES = [
  'Every profile starts with verified phone number authentication.',
  'Aadhaar verification via DigiLocker keeps fake profiles out.',
  'AI-powered chat monitoring blocks scam and harassment attempts in real time.',
  'Zero tolerance for money requests — instant ban on detection.',
  'Your data, your control — delete your account and all data anytime.',
];

export default function Landing() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMsgIndex((i) => (i + 1) % TRUST_MESSAGES.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="bg-brand-600 text-white text-center text-sm py-2 px-4">
        🛡️ {TRUST_MESSAGES[msgIndex]}
      </div>

      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Find Real Connections, <span className="text-brand-600">Safely</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          DateInIndia is built for Indians who want genuine relationships without the fakes, scams,
          and catfishing common on other apps. Verified profiles, AI-powered safety monitoring, and a
          trust score on every member.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="px-8 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700">
            Get Started Free
          </Link>
          <Link to="/trust" className="px-8 py-3 bg-white border border-gray-300 rounded-full font-semibold hover:bg-gray-50">
            View Trust Report
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <Feature title="Aadhaar-Verified Profiles" desc="Optional DigiLocker-based Aadhaar verification means you know who you're really talking to." icon="🪪" />
          <Feature title="AI Safety Monitoring" desc="Our system automatically detects and blocks scam patterns, money requests, and harassment in chat." icon="🛡️" />
          <Feature title="Built for India" desc="Filters for religion, city, state, and relationship goals that actually matter to Indian users." icon="🇮🇳" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Serious about relationships, serious about safety</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Every member gets a public Trust Score based on verification status, profile completeness,
          and community standing. Scammers and harassers are banned instantly and automatically.
        </p>
        <Link to="/safety-tips" className="text-brand-600 font-semibold hover:underline">Read our safety tips →</Link>
      </section>
    </div>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
