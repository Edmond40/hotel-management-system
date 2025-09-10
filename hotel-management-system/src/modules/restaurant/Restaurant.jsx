import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import http from '../../features/shared/services/http.js';

function Restaurant() {
	const [menuItems, setMenuItems] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ name: '', category: 'Main', price: 0, available: true });
	const [loading, setLoading] = useState(true);

	useEffect(() => { 
		fetchMenu(); 
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchMenu();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchMenu() {
		try {
			const data = await http.get('/admin/menu');
			setMenuItems(data);
		} catch (e) {
			console.error('Failed to load menu', e.message || e);
		} finally {
			setLoading(false);
		}
	}

	const openForCreate = () => {
		setEditing(null);
		setForm({ name: '', category: 'Main', price: 0, available: true });
		setIsOpen(true);
	};

	const openForEdit = (item) => {
		setEditing(item);
		setForm({ name: item.name, category: item.category, price: item.price, available: item.available });
		setIsOpen(true);
	};

	async function remove(id) {
		await http.delete(`/admin/menu/${id}`);
		fetchMenu();
	}

	async function toggleAvail(id) {
		const item = menuItems.find(i => i.id === id);
		if (item) {
			await http.put(`/admin/menu/${id}`, { available: !item.available });
			fetchMenu();
		}
	}

	async function save(e) {
		e.preventDefault();
		if (editing) {
			await http.put(`/admin/menu/${editing.id}`, form);
		} else {
			await http.post('/admin/menu', form);
		}
		setIsOpen(false);
		fetchMenu();
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
				<h2 className="text-2xl font-bold text-slate-900" data-aos="fade-left">Restaurant</h2>
				<button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" data-aos="fade-right">
					<Plus size={18} /> New Menu Item
				</button>
			</div>

			<div className="overflow-x-auto bg-white rounded-lg border border-slate-200" data-aos="fade-up">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left p-3">Name</th>
							<th className="text-left p-3">Category</th>
							<th className="text-left p-3">Price</th>
							<th className="text-left p-3">Availability</th>
							<th className="text-right p-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{menuItems.map((i) => (
							<tr key={i.id} className="border-t">
								<td className="p-3">{i.name}</td>
								<td className="p-3">{i.category}</td>
								<td className="p-3">₵{i.price.toFixed(2)}</td>
								<td className="p-3">
									<button onClick={() => toggleAvail(i.id)} className={`inline-flex items-center gap-1 ${i.available ? 'text-emerald-600' : 'text-slate-400'}`}>
										{i.available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {i.available ? 'Available' : 'Unavailable'}
									</button>
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
							<h3 className="font-semibold">{editing ? 'Edit Menu Item' : 'New Menu Item'}</h3>
							<button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
						</div>
						<form onSubmit={save} className="p-4 grid grid-cols-2 gap-3">
							<label className="col-span-2">
								<span className="text-sm text-slate-600">Name</span>
								<input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
							</label>
							<label>
								<span className="text-sm text-slate-600">Category</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
									<option value="">Select Category</option>
									<option value="Main">Main Course</option>
									<option value="Appetizer">Appetizer</option>
									<option value="Side">Side Dish</option>
									<option value="Dessert">Dessert</option>
									<option value="Drink">Beverage</option>
									<option value="Breakfast">Breakfast</option>
									<option value="Lunch">Lunch</option>
									<option value="Dinner">Dinner</option>
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Price</span>
								<input type="number" min="0" className="mt-1 w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
							</label>
							<label className="flex items-end gap-2">
								<input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
								<span className="text-sm text-slate-600">Available</span>
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

export default Restaurant;


