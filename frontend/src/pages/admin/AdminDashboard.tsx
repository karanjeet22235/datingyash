import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    adminApi.get('/admin/analytics').then((r) => setAnalytics(r.data));
    adminApi.get('/admin/users').then((r) => setUsers(r.data.users));
  }, []);

  async function toggleBan(id: string, ban: boolean) {
    await adminApi.post(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`, { reason: 'Admin action' });
    const r = await adminApi.get('/admin/users');
    setUsers(r.data.users);
  }

  if (!analytics) return <p>Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(analytics).map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{v as any}</p>
            <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Trust</th>
              <th className="p-3">Strikes</th><th className="p-3">Premium</th><th className="p-3">Status</th><th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name || '(no name)'}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.trustScore}</td>
                <td className="p-3">{u.strikes}</td>
                <td className="p-3">{u.premiumTier}</td>
                <td className="p-3">{u.isBanned ? <span className="text-red-600">Banned</span> : <span className="text-green-600">Active</span>}</td>
                <td className="p-3">
                  <button onClick={() => toggleBan(u.id, !u.isBanned)} className="text-brand-600 hover:underline">
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
