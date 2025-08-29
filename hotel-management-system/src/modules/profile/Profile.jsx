import { useEffect, useState } from 'react';

const STORAGE_PROFILE = 'user-profile';

function Profile() {
  const [form, setForm] = useState({ name: 'Admin User', email: 'admin@hotel.com', phone: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_PROFILE);
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const save = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(form));
    alert('Profile saved');
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900" data-aos="fade-right">Profile</h2>
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4" data-aos="fade-left">
        <label className="col-span-2">
          <span className="text-sm text-slate-600">Name</span>
          <input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="col-span-2">
          <span className="text-sm text-slate-600">Email</span>
          <input type="email" className="mt-1 w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="col-span-2">
          <span className="text-sm text-slate-600">Phone</span>
          <input className="mt-1 w-full border rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <div className="col-span-2 flex justify-end">
          <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Save Profile</button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
