import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { UserProfile } from '../types';
import TrustBadge from '../components/TrustBadge';

export default function ProfileView() {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/profile/${id}`).then((r) => setUser(r.data.user)).catch((e) => setError(e.response?.data?.error || 'Failed to load'));
  }, [id]);

  async function submitReport() {
    try {
      await api.post('/safety/report', { reportedId: id, reason: reportReason, details: reportDetails });
      setMsg('Report submitted. Our team will review it.');
      setShowReport(false);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Failed to report');
    }
  }

  async function block() {
    try {
      await api.post('/safety/block', { blockedId: id });
      setMsg('User blocked.');
      navigate('/browse');
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Failed to block');
    }
  }

  if (error) return <p className="text-center py-20 text-red-600">{error}</p>;
  if (!user) return <p className="text-center py-20">Loading...</p>;

  const age = user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-80 bg-gray-200">
          {user.photos[0] ? (
            <img src={`${import.meta.env.VITE_API_URL}${user.photos[0].url}`} className="w-full h-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No photo</div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold">{user.name}{age ? `, ${age}` : ''}</h1>
          <p className="text-gray-500 mb-2">{user.city}{user.state ? `, ${user.state}` : ''}</p>
          <TrustBadge trustScore={user.trustScore} aadhaarVerified={user.aadhaarVerified} selfieVerified={user.selfieVerified} phoneVerified={user.phoneVerified} size="md" />

          {user.bio && <p className="mt-4 text-gray-700">{user.bio}</p>}

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-gray-600">
            {user.jobTitle && <p><strong>Work:</strong> {user.jobTitle}</p>}
            {user.education && <p><strong>Education:</strong> {user.education}</p>}
            {user.religion && <p><strong>Religion:</strong> {user.religion}</p>}
            {user.relationshipGoal && <p><strong>Looking for:</strong> {user.relationshipGoal}</p>}
          </div>

          {user.interests.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {user.interests.map((i) => <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{i}</span>)}
            </div>
          )}

          {user.prompts.length > 0 && (
            <div className="mt-4 space-y-3">
              {user.prompts.map((p, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{p.question}</p>
                  <p className="font-medium">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => api.post(`/likes/${id}/pass`).then(() => navigate('/browse'))} className="flex-1 border rounded-full py-2 hover:bg-gray-50">Pass</button>
            <button onClick={() => api.post(`/likes/${id}/like`).then(() => navigate('/browse'))} className="flex-1 bg-brand-600 text-white rounded-full py-2 hover:bg-brand-700">Like</button>
          </div>

          <div className="flex gap-4 mt-4 text-sm">
            <button onClick={() => setShowReport(true)} className="text-gray-500 hover:underline">Report</button>
            <button onClick={block} className="text-gray-500 hover:underline">Block</button>
          </div>

          {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-3">Report this profile</h3>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border rounded px-3 py-2 mb-3">
              <option value="harassment">Harassment</option>
              <option value="fake_profile">Fake profile</option>
              <option value="inappropriate_content">Inappropriate content</option>
              <option value="scam_attempt">Scam attempt</option>
              <option value="underage">Underage user</option>
              <option value="other">Other</option>
            </select>
            <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Additional details (optional)" className="w-full border rounded px-3 py-2 mb-3" rows={3} />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="flex-1 border rounded-lg py-2">Cancel</button>
              <button onClick={submitReport} className="flex-1 bg-red-600 text-white rounded-lg py-2">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
