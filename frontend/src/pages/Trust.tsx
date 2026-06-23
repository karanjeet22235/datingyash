import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Trust() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/trust/transparency').then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Trust &amp; Transparency Report</h1>
      <p className="text-gray-500 mb-8">Live stats as of {new Date(data.asOf).toLocaleString()}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Total Users" value={data.totalUsers} />
        <Stat label="Verified Users" value={data.verifiedUsers} />
        <Stat label="Verification Rate" value={`${data.verificationRate}%`} />
        <Stat label="Messages Scanned" value={data.messagesScanned} />
        <Stat label="Messages Blocked" value={data.messagesBlocked} />
        <Stat label="Users Banned" value={data.usersBanned} />
        <Stat label="Reports Filed" value={data.reportsFiled} />
      </div>

      <div className="mt-10 bg-gray-50 rounded-xl p-6 text-sm text-gray-600 space-y-2">
        <h3 className="font-semibold text-gray-800">How we keep DateInIndia safe</h3>
        <p>Every chat message is automatically scanned for scam patterns: phone numbers, UPI IDs, requests to move off-platform, money requests, cryptocurrency mentions, and investment scams.</p>
        <p>Accounts attempting to request money or matching scam patterns are banned automatically and instantly — no human review needed for clear-cut cases.</p>
        <p>Phone and UPI sharing is blocked entirely for the first 7 days after a match, giving you time to build trust safely.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center">
      <p className="text-2xl font-bold text-brand-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
