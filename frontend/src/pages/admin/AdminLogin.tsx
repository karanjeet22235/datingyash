import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';

export default function AdminLogin() {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('adminSecret', secret);
    try {
      await adminApi.get('/admin/analytics');
      navigate('/admin/dashboard');
    } catch (e: any) {
      sessionStorage.removeItem('adminSecret');
      setError('Invalid admin secret key');
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          placeholder="Admin secret key"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="input"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-gray-900 text-white rounded-lg py-2.5 font-semibold hover:bg-gray-800">Login</button>
      </form>
    </div>
  );
}
