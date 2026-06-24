import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { UserProfile } from '../types';
import TrustBadge from '../components/TrustBadge';

export default function Browse() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({
    minAge: '', maxAge: '', city: '', state: '', lookingFor: '', religion: '',
    verifiedOnly: false, onlineOnly: false,
  });
  const [actionMsg, setActionMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, sort };
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== false) params[k] = v;
      });
      const resp = await api.get('/browse', { params });
      setUsers(resp.data.users);
      setTotalPages(resp.data.pagination.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, sort]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function act(userId: string, action: 'like' | 'pass' | 'superlike') {
    try {
      const resp = await api.post(`/likes/${userId}/${action}`);
      if (resp.data.isMatch) setActionMsg("It's a match! Check your Messages.");
      else setActionMsg(action === 'like' ? 'Liked!' : action === 'superlike' ? 'Super liked!' : 'Passed');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTimeout(() => setActionMsg(''), 2500);
    } catch (e: any) {
      setActionMsg(e.response?.data?.error || 'Action failed');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
      <aside className="w-64 shrink-0 hidden md:block">
        <form onSubmit={applyFilters} className="bg-white rounded-xl p-4 shadow-sm space-y-4 sticky top-20">
          <h3 className="font-bold">Filters</h3>
          <div className="flex gap-2">
            <input type="number" placeholder="Min age" value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            <input type="number" placeholder="Max age" value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
          <input placeholder="State" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
          <select value={filters.lookingFor} onChange={(e) => setFilters({ ...filters, lookingFor: e.target.value })} className="w-full border rounded px-2 py-1 text-sm">
            <option value="">Looking for: Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select value={filters.religion} onChange={(e) => setFilters({ ...filters, religion: e.target.value })} className="w-full border rounded px-2 py-1 text-sm">
            <option value="">Religion: Any</option>
            <option>Hindu</option>
            <option>Muslim</option>
            <option>Christian</option>
            <option>Sikh</option>
            <option>Other</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })} />
            Verified only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.onlineOnly} onChange={(e) => setFilters({ ...filters, onlineOnly: e.target.checked })} />
            Online now
          </label>
          <button className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700">Apply Filters</button>
        </form>
      </aside>

      <main className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Browse Members</h2>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="newest">Newest</option>
            <option value="online">Online First</option>
            <option value="best-match">Best Match</option>
          </select>
        </div>

        {actionMsg && <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">{actionMsg}</div>}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No more profiles match your filters right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Link to={`/profile/${u.id}`}>
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                    {u.photos[0] ? (
                      <img src={`${import.meta.env.VITE_API_URL}${u.photos[0].url}`} className="w-full h-full object-cover" />
                    ) : (
                      <span>No photo</span>
                    )}
                    {u.isOnline && <span className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                </Link>
                <div className="p-3">
                  <p className="font-semibold">{u.name}{u.dob ? `, ${new Date().getFullYear() - new Date(u.dob).getFullYear()}` : ''}</p>
                  <p className="text-xs text-gray-500 mb-1">{u.city}{u.state ? `, ${u.state}` : ''}</p>
                  <TrustBadge trustScore={u.trustScore} aadhaarVerified={u.aadhaarVerified} selfieVerified={u.selfieVerified} phoneVerified={u.phoneVerified} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => act(u.id, 'pass')} className="flex-1 border border-gray-300 rounded-full py-1 text-sm hover:bg-gray-50">Pass</button>
                    <button onClick={() => act(u.id, 'like')} className="flex-1 bg-brand-600 text-white rounded-full py-1 text-sm hover:bg-brand-700">Like</button>
                    <button onClick={() => act(u.id, 'superlike')} className="flex-1 bg-yellow-400 text-white rounded-full py-1 text-sm hover:bg-yellow-500">★</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
          <span className="px-3 py-1">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      </main>
    </div>
  );
}
