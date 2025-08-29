import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import http from '../../features/shared/services/http.js';

function Staff() {
	const [staff, setStaff] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ name: '', role: 'Receptionist', email: '' });
	const [loading, setLoading] = useState(true);

	useEffect(() => { fetchStaff(); }, []);

	async function fetchStaff() {
		try {
			const data = await http.get('/admin/users');
			// Filter to show only staff (non-admin users) and map to display staffRole
			const staffUsers = data
				.filter(user => user.role === 'GUEST')
				.map(user => ({
					...user,
					role: user.staffRole || 'Unassigned' // Use staffRole if available, fallback to 'Unassigned'
				}));
			setStaff(staffUsers);
		} catch (e) {
			console.error('Failed to load staff', e.message || e);
		} finally {
			setLoading(false);
		}
	}

	const openForCreate = () => { setEditing(null); setForm({ name: '', role: 'Receptionist', email: '' }); setIsOpen(true); };
	const openForEdit = (s) => { 
		setEditing(s); 
		setForm({ 
			name: s.name, 
			role: s.staffRole || s.role, // Use staffRole for editing
			email: s.email 
		}); 
		setIsOpen(true); 
	};

	async function remove(id) {
		await http.delete(`/admin/users/${id}`);
		fetchStaff();
	}

	async function save(e) {
		e.preventDefault();
		if (editing) {
			await http.put(`/admin/users/${editing.id}`, { 
				name: form.name, 
				email: form.email,
				staffRole: form.role // Save as staffRole
			});
		} else {
			await http.post('/admin/users', { 
				name: form.name, 
				email: form.email, 
				role: 'GUEST',
				staffRole: form.role // Save as staffRole
			});
		}
		setIsOpen(false);
		fetchStaff();
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-slate-900" data-aos="fade-left">Staff</h2>
				<button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" data-aos="fade-right">
					<Plus size={18} /> New Staff
				</button>
			</div>

			<div className="overflow-x-auto bg-white rounded-lg border border-slate-200" data-aos="fade-up">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left p-3">Name</th>
							<th className="text-left p-3">Role</th>
							<th className="text-left p-3">Email</th>
							<th className="text-right p-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{staff.map((s) => (
							<tr key={s.id} className="border-t">
								<td className="p-3">{s.name}</td>
								<td className="p-3">
									<span className={`px-2 py-1 rounded text-xs ${
										s.role === 'Receptionist' ? 'bg-blue-100 text-blue-700' :
										s.role === 'Housekeeping' ? 'bg-green-100 text-green-700' :
										s.role === 'Security' ? 'bg-red-100 text-red-700' :
										s.role === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
										'bg-gray-100 text-gray-700'
									}`}>
										{s.role}
									</span>
								</td>
								<td className="p-3">{s.email}</td>
								<td className="p-3 text-right space-x-2">
									<button onClick={() => openForEdit(s)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"><Pencil size={16} /> Edit</button>
									<button onClick={() => remove(s.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"><Trash2 size={16} /> Delete</button>
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
							<h3 className="font-semibold">{editing ? 'Edit Staff' : 'New Staff'}</h3>
							<button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
						</div>
						<form onSubmit={save} className="p-4 grid grid-cols-2 gap-3">
							<label className="col-span-2">
								<span className="text-sm text-slate-600">Name</span>
								<input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
							</label>
							<label>
								<span className="text-sm text-slate-600">Role</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
									<option value="">Select Role</option>
									<option value="Receptionist">Receptionist</option>
									<option value="Housekeeping">Housekeeping</option>
									<option value="Security">Security</option>
									<option value="Maintenance">Maintenance</option>
									<option value="Manager">Manager</option>
									<option value="Chef">Chef</option>
									<option value="Waiter">Waiter</option>
									<option value="Bartender">Bartender</option>
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Email</span>
								<input type="email" className="mt-1 w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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

export default Staff;
