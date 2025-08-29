import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import http from '../../features/shared/services/http.js';

function Guests() {
    const [guests, setGuests] = useState([]);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'GUEST' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchGuests(); }, []);

    async function fetchGuests() {
        try {
            const data = await http.get('/admin/users');
            setGuests(data);
        } catch (e) {
            console.error('Failed to load users', e.message || e);
        } finally {
            setLoading(false);
        }
    }

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return guests.filter((g) => [g.name, g.email, g.role].join(' ').toLowerCase().includes(q));
    }, [guests, query]);

    const openForCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'GUEST' }); setIsOpen(true); };
    const openForEdit = (g) => { setEditing(g); setForm({ name: g.name, email: g.email, password: '', role: g.role }); setIsOpen(true); };

    async function remove(id) {
        await http.delete(`/admin/users/${id}`);
        fetchGuests();
    }

    async function save(e) {
        e.preventDefault();
        if (editing) {
            const payload = { name: form.name, email: form.email, role: form.role };
            if (form.password) payload.password = form.password;
            await http.put(`/admin/users/${editing.id}`, payload);
        } else {
            await http.post('/admin/users', form);
        }
        setIsOpen(false);
        fetchGuests();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900" data-aos="fade-left">Guests</h2>
                <div className="flex items-center gap-2" data-aos="fade-right">
                    <div className="relative">
                        <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guests" className="pl-7 pr-3 py-2 border rounded-md" />
                    </div>
                    <button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
                        <Plus size={18} /> New User
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200" data-aos="fade-up">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Role</th>
                            <th className="text-right p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((g) => (
                            <tr key={g.id} className="border-t">
                                <td className="p-3">{g.name}</td>
                                <td className="p-3">{g.email}</td>
                                <td className="p-3">{g.role}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button onClick={() => openForEdit(g)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"><Pencil size={16} /> Edit</button>
                                    <button onClick={() => remove(g.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"><Trash2 size={16} /> Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-lg" data-aos="zoom-in">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold">{editing ? 'Edit User' : 'New User'}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="p-4 grid grid-cols-2 gap-3">
                            <label className="col-span-2">
                                <span className="text-sm text-slate-600">Name</span>
                                <input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </label>
                            <label>
                                <span className="text-sm text-slate-600">Email</span>
                                <input type="email" className="mt-1 w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </label>
                            <label>
                                <span className="text-sm text-slate-600">Role</span>
                                <select className="mt-1 w-full border rounded px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                                    <option value="">Select Role</option>
                                    <option value="GUEST">Guest</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </label>
                            <label className="col-span-2">
                                <span className="text-sm text-slate-600">{editing ? 'New Password (optional)' : 'Password'}</span>
                                <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
                            </label>
                            <div className="col-span-2 flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Guests;
