import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.post('/auth/otp/send', { phone });
      if (resp.data.devOtp) setDevOtp(resp.data.devOtp);
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.post('/auth/otp/verify', { phone, code });
      localStorage.setItem('accessToken', resp.data.accessToken);
      localStorage.setItem('refreshToken', resp.data.refreshToken);
      await refreshUser();
      if (!resp.data.user.profileComplete) navigate('/profile/me/edit');
      else navigate('/browse');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-2 text-center">Welcome to DateInIndia</h1>
      <p className="text-gray-500 text-center mb-8">Login or sign up with your phone number</p>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Phone Number</span>
            <input
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-semibold hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          {devOtp && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
              <strong>Dev mode:</strong> Your OTP is <span className="font-mono text-lg">{devOtp}</span> (no real SMS sent — set MOCK_OTP=false with MSG91 credentials for production)
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Enter OTP</span>
            <input
              type="text"
              required
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-semibold hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-gray-500 hover:underline">
            Change phone number
          </button>
        </form>
      )}
    </div>
  );
}
