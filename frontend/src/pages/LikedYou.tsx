import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function LikedYou() {
  const [data, setData] = useState<{ isPremium: boolean; likes: any[] } | null>(null);

  useEffect(() => {
    api.get('/likes/liked-you').then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">People Who Liked You</h1>
      {!data.isPremium && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6 text-sm">
          Upgrade to Premium to see who liked you clearly. <Link to="/premium" className="text-brand-600 font-semibold hover:underline">View plans →</Link>
        </div>
      )}
      {data.likes.length === 0 ? (
        <p className="text-gray-500">No likes yet. Keep your profile updated to get noticed!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.likes.map((l) => (
            <div key={l.likeId} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className={`h-40 bg-gray-200 ${!data.isPremium ? 'blur-md' : ''}`}>
                {l.user.photos?.[0] && <img src={`${import.meta.env.VITE_API_URL}${l.user.photos[0].url}`} className="w-full h-full object-cover" />}
              </div>
              <div className="p-2 text-sm">
                <p className="font-semibold">{data.isPremium ? l.user.name : '????'}</p>
                {l.type === 'superlike' && <span className="text-yellow-500 text-xs">★ Super liked you</span>}
                {data.isPremium && (
                  <Link to={`/profile/${l.user.id}`} className="text-brand-600 text-xs hover:underline">View profile</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
