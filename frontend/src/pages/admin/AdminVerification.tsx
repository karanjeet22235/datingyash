import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export default function AdminVerification() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    adminApi.get('/admin/verification-queue').then((r) => setItems(r.data.verifications));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Verification / Fraud Queue</h2>
      <p className="text-sm text-gray-500">
        In mock mode, Aadhaar and selfie verifications auto-approve immediately, so this queue stays empty during local dev.
        It exists for the production flow once real DigiLocker/HyperVerge integration is wired in (see README).
      </p>
      {items.length === 0 && <p className="text-gray-500">No pending verifications.</p>}
      {items.map((v) => (
        <div key={v.id} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm"><strong>{v.user.name || v.user.phone}</strong> — {v.type} verification</p>
          <p className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
