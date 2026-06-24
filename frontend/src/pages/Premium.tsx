import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Premium() {
  const { user, refreshUser } = useAuth();
  const [tiers, setTiers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/premium/tiers').then((r) => setTiers(r.data.tiers));
  }, []);

  async function subscribe(tier: string) {
    setMsg('');
    try {
      const order = await api.post('/premium/checkout/order', { tier });
      // Real Razorpay flow would open checkout widget here using order.data.order.orderId / razorpayKeyId.
      // In dev/mock mode, we complete the "fake checkout" immediately so the flow is testable.
      if (order.data.order.mock) {
        const complete = await api.post('/premium/checkout/fake-complete', { subscriptionId: order.data.subscriptionId });
        setMsg(complete.data.message);
        await refreshUser();
      } else {
        setMsg('Razorpay checkout would open here in production.');
      }
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Checkout failed');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
      <p className="text-center text-gray-500 mb-8">
        Current plan: <strong>{user?.premiumTier || 'none'}</strong>. Payments run in mock mode locally (no real Razorpay charge) — see README.
      </p>
      {msg && <div className="max-w-md mx-auto bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 text-center">{msg}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
            <h2 className="text-xl font-bold">{t.name}</h2>
            <p className="text-3xl font-bold my-3">₹{t.price}<span className="text-sm text-gray-500">/{t.period}</span></p>
            <ul className="text-sm text-gray-600 space-y-1 flex-1 mb-4">
              {t.features.map((f: string) => <li key={f}>✓ {f}</li>)}
            </ul>
            <button
              onClick={() => subscribe(t.id)}
              disabled={user?.premiumTier === t.id}
              className="bg-brand-600 text-white rounded-lg py-2 font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {user?.premiumTier === t.id ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
