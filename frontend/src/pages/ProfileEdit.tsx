import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Photo } from '../types';

export default function ProfileEdit() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<any>({});
  const [interestsText, setInterestsText] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [msg, setMsg] = useState('');
  const [aiBio, setAiBio] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '', dob: user.dob ? user.dob.slice(0, 10) : '', gender: user.gender || '',
        lookingFor: user.lookingFor || '', city: user.city || '', state: user.state || '',
        bio: user.bio || '', jobTitle: user.jobTitle || '', education: user.education || '',
        religion: user.religion || '', relationshipGoal: user.relationshipGoal || '',
      });
      setInterestsText((user.interests || []).join(', '));
      setPhotos(user.photos || []);
    }
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const interests = interestsText.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put('/profile/me', { ...form, interests });
      await refreshUser();
      setMsg('Profile saved!');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Failed to save');
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    const resp = await api.post('/profile/me/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setPhotos((p) => [...p, resp.data.photo]);
  }

  async function deletePhoto(id: string) {
    await api.delete(`/profile/me/photos/${id}`);
    setPhotos((p) => p.filter((ph) => ph.id !== id));
  }

  async function getAiBio() {
    const resp = await api.post('/ai/suggest-bio');
    setAiBio(resp.data.bio);
  }

  if (!user) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold mb-3">Photos</h3>
        <div className="flex gap-3 flex-wrap mb-3">
          {photos.map((p) => (
            <div key={p.id} className="relative w-24 h-24">
              <img src={`${import.meta.env.VITE_API_URL}${p.url}`} className="w-24 h-24 object-cover rounded-lg" />
              <button onClick={() => deletePhoto(p.id!)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs">×</button>
              {p.isPrimary && <span className="absolute bottom-0 left-0 bg-brand-600 text-white text-[10px] px-1 rounded">Primary</span>}
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" onChange={uploadPhoto} />
      </div>

      <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Date of Birth"><input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
        <Field label="Gender">
          <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </Field>
        <Field label="Looking For">
          <select className="input" value={form.lookingFor} onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}>
            <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="everyone">Everyone</option>
          </select>
        </Field>
        <Field label="City"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="State"><input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
        <Field label="Bio">
          <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <button type="button" onClick={getAiBio} className="text-xs text-brand-600 mt-1 hover:underline">✨ Suggest bio with AI</button>
          {aiBio && <p className="text-xs text-gray-500 mt-1">Suggestion: "{aiBio}" <button type="button" onClick={() => setForm({ ...form, bio: aiBio })} className="text-brand-600 underline">Use this</button></p>}
        </Field>
        <Field label="Job Title"><input className="input" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></Field>
        <Field label="Education"><input className="input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></Field>
        <Field label="Religion">
          <select className="input" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}>
            <option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Sikh</option><option>Other</option>
          </select>
        </Field>
        <Field label="Relationship Goal">
          <select className="input" value={form.relationshipGoal} onChange={(e) => setForm({ ...form, relationshipGoal: e.target.value })}>
            <option value="">Select</option><option value="long-term">Long-term</option><option value="marriage">Marriage</option><option value="casual">Casual</option><option value="friends">Friends</option><option value="figuring-out">Still figuring out</option>
          </select>
        </Field>
        <Field label="Interests (comma separated)"><input className="input" value={interestsText} onChange={(e) => setInterestsText(e.target.value)} /></Field>

        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        <button className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-semibold hover:bg-brand-700">Save Profile</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
