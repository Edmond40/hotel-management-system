import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import http from '../../features/shared/services/http.js';

function Billing() {
	const [invoices, setInvoices] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ userId: '', amount: '', status: 'Unpaid' });
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState([]);

	useEffect(() => { 
		fetchAll(); 
		fetchUsers();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchAll();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchAll() {
		try {
			const data = await http.get('/admin/invoices');
			setInvoices(data);
		} catch (e) {
			console.error('Failed to load invoices', e.message || e);
		} finally {
			setLoading(false);
		}
	}

	async function fetchUsers() {
		try {
			const data = await http.get('/admin/users');
			setUsers(data);
		} catch (e) {
			console.error('Failed to load users', e.message || e);
		}
	}

	const openForCreate = () => { setEditing(null); setForm({ userId: '', amount: '', status: 'Unpaid' }); setIsOpen(true); };
	const openForEdit = (i) => { setEditing(i); setForm({ userId: i.userId, amount: i.amount, status: i.status }); setIsOpen(true); };

	async function remove(id) {
		await http.delete(`/admin/invoices/${id}`);
		fetchAll();
	}

	async function save(e) {
		e.preventDefault();
		if (editing) {
			await http.put(`/admin/invoices/${editing.id}`, form);
		} else {
			await http.post('/admin/invoices', form);
		}
		setIsOpen(false);
		fetchAll();
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
				<h2 className="text-2xl font-bold text-slate-900" data-aos="fade-left">Billing</h2>
				<button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" data-aos="fade-right">
					<Plus size={18} /> New Invoice
				</button>
			</div>

			<div className="overflow-x-auto bg-white rounded-lg border border-slate-200" data-aos="fade-up">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left p-3">Customer</th>
							<th className="text-left p-3">Amount</th>
							<th className="text-left p-3">Status</th>
							<th className="text-right p-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{invoices.map((i) => (
							<tr key={i.id} className="border-t">
								<td className="p-3">{i.user?.name || i.userId}</td>
								<td className="p-3">${i.amount}</td>
								<td className="p-3">
									<span className={`px-2 py-1 rounded text-xs ${
										i.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
									}`}>
										{i.status}
									</span>
								</td>
								<td className="p-3 text-right space-x-2">
									<button onClick={() => openForEdit(i)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"><Pencil size={16} /> Edit</button>
									<button onClick={() => remove(i.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"><Trash2 size={16} /> Delete</button>
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
							<h3 className="font-semibold">{editing ? 'Edit Invoice' : 'New Invoice'}</h3>
							<button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
						</div>
						<form onSubmit={save} className="p-4 grid grid-cols-2 gap-3">
							<label className="col-span-2">
								<span className="text-sm text-slate-600">Customer</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.userId} 
									onChange={(e) => setForm({ ...form, userId: e.target.value })} 
									required
								>
									<option value="">Select Customer</option>
									{users.map(user => (
										<option key={user.id} value={user.id}>
											{user.name} ({user.email})
										</option>
									))}
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Amount</span>
								<input type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
							</label>
							<label>
								<span className="text-sm text-slate-600">Status</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
									<option>Unpaid</option>
									<option>Paid</option>
								</select>
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

export default Billing;
