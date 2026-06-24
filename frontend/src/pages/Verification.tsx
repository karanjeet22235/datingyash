import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Verification() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [msg, setMsg] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    api.get('/verification/status').then((r) => setStatus(r.data));
  }, []);

  async function submitAadhaar(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const resp = await api.post('/verification/aadhaar', { fullName, dob });
      setMsg(resp.data.message);
      await refreshUser();
      const s = await api.get('/verification/status');
      setStatus(s.data);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Verification failed');
    }
  }

  async function submitSelfie(e: React.FormEvent) {
    e.preventDefault();
    if (!selfieFile) return;
    setMsg('');
    const fd = new FormData();
    fd.append('selfie', selfieFile);
    try {
      const resp = await api.post('/verification/selfie', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(resp.data.message);
      await refreshUser();
      const s = await api.get('/verification/status');
      setStatus(s.data);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Verification failed');
    }
  }

  if (!status) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Verification Hub</h1>
      <p className="text-gray-600 text-sm">Boost your Trust Score and stand out by verifying your identity. All verification methods run in development/mock mode in this environment — see README for production setup.</p>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{msg}</div>}

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-1">📱 Phone Verification</h3>
        <p className="text-sm text-gray-500 mb-2">+10 trust points</p>
        <p className={`text-sm font-medium ${status.phoneVerified ? 'text-green-600' : 'text-gray-400'}`}>
          {status.phoneVerified ? '✓ Verified' : 'Not verified'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-1">🪪 Aadhaar Verification (via DigiLocker)</h3>
        <p className="text-sm text-gray-500 mb-3">+30 trust points · Mock mode: confirms your name &amp; DOB, never asks for your Aadhaar number</p>
        {status.aadhaarVerified ? (
          <p className="text-green-600 text-sm font-medium">✓ Verified</p>
        ) : (
          <form onSubmit={submitAadhaar} className="space-y-2">
            <input required placeholder="Full name as per Aadhaar" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
            <input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
            <button className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700">Verify via Mock DigiLocker</button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-1">🤳 Selfie Liveness Check</h3>
        <p className="text-sm text-gray-500 mb-3">+20 trust points · Mock mode: any uploaded photo is auto-approved</p>
        {status.selfieVerified ? (
          <p className="text-green-600 text-sm font-medium">✓ Verified</p>
        ) : (
          <form onSubmit={submitSelfie} className="space-y-2">
            <input required type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
            <button className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700">Verify Selfie</button>
          </form>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-5 text-center">
        <p className="text-sm text-gray-500">Your Trust Score</p>
        <p className="text-3xl font-bold text-brand-600">{status.trustScore}/100</p>
      </div>
    </div>
  );
}
