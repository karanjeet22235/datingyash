import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);

  async function load() {
    const r = await adminApi.get('/admin/reports', { params: { status: 'pending' } });
    setReports(r.data.reports);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string, action: string) {
    await adminApi.post(`/admin/reports/${id}/resolve`, { action });
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Reports Queue ({reports.length} pending)</h2>
      {reports.length === 0 && <p className="text-gray-500">No pending reports.</p>}
      {reports.map((r) => (
        <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm"><strong>{r.reporter.name || r.reporter.phone}</strong> reported <strong>{r.reported.name || r.reported.phone}</strong></p>
          <p className="text-sm text-gray-600">Reason: <span className="font-medium">{r.reason}</span></p>
          {r.details && <p className="text-sm text-gray-500 italic">"{r.details}"</p>}
          <p className="text-xs text-gray-400 mt-1">Reported user trust score: {r.reported.trustScore}, strikes: {r.reported.strikes}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => resolve(r.id, 'dismiss')} className="px-3 py-1 border rounded text-sm">Dismiss</button>
            <button onClick={() => resolve(r.id, 'warn')} className="px-3 py-1 border rounded text-sm text-yellow-700">Warn (strike)</button>
            <button onClick={() => resolve(r.id, 'ban')} className="px-3 py-1 border rounded text-sm text-red-600">Ban</button>
          </div>
        </div>
      ))}
    </div>
  );
}
