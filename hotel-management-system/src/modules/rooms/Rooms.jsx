import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const initialRooms = [
	{ id: 1, number: '101', type: 'Single', price: 80, available: true },
	{ id: 2, number: '202', type: 'Double', price: 120, available: false },
	{ id: 3, number: '305', type: 'Suite', price: 220, available: true },
];

function Rooms() {
	const [rooms, setRooms] = useState(initialRooms);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ number: '', type: 'Single', price: 0, available: true });

	const openForCreate = () => {
		setEditing(null);
		setForm({ number: '', type: 'Single', price: 0, available: true });
		setIsOpen(true);
	};

	const openForEdit = (r) => {
		setEditing(r);
		setForm({ number: r.number, type: r.type, price: r.price, available: r.available });
		setIsOpen(true);
	};

	const remove = (id) => setRooms((list) => list.filter((r) => r.id !== id));
	const toggleAvail = (id) => setRooms((list) => list.map((r) => (r.id === id ? { ...r, available: !r.available } : r)));

	const save = (e) => {
		e.preventDefault();
		if (editing) {
			setRooms((list) => list.map((r) => (r.id === editing.id ? { ...editing, ...form, price: Number(form.price) } : r)));
		} else {
			const nextId = Math.max(0, ...rooms.map((r) => r.id)) + 1;
			setRooms((list) => [...list, { id: nextId, ...form, price: Number(form.price) }]);
		}
		setIsOpen(false);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<h2 className="text-xl sm:text-2xl font-bold text-slate-900" data-aos="fade-left">Rooms</h2>
				<button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-emerald-700 text-sm sm:text-base" data-aos="fade-right">
					<Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> New Room
				</button>
			</div>

			<div className="overflow-x-auto bg-white rounded-lg border border-slate-200" data-aos="fade-up">
				<table className="min-w-full text-xs sm:text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left p-2 sm:p-3">Number</th>
							<th className="text-left p-2 sm:p-3">Type</th>
							<th className="text-left p-2 sm:p-3">Price</th>
							<th className="text-left p-2 sm:p-3 hidden sm:table-cell">Availability</th>
							<th className="text-right p-2 sm:p-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{rooms.map((r) => (
							<tr key={r.id} className="border-t">
								<td className="p-2 sm:p-3">{r.number}</td>
								<td className="p-2 sm:p-3">{r.type}</td>
								<td className="p-2 sm:p-3">${r.price.toFixed(2)}</td>
								<td className="p-2 sm:p-3 hidden sm:table-cell">
									<button onClick={() => toggleAvail(r.id)} className={`inline-flex items-center gap-1 text-xs sm:text-sm ${r.available ? 'text-emerald-600' : 'text-slate-400'}`}>
										{r.available ? <ToggleRight size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ToggleLeft size={16} className="sm:w-[18px] sm:h-[18px]" />} 
										<span className="hidden sm:inline">{r.available ? 'Available' : 'Unavailable'}</span>
									</button>
								</td>
								<td className="p-2 sm:p-3 text-right">
									<div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-end">
										<button onClick={() => openForEdit(r)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
											<Pencil size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Edit</span>
										</button>
										<button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs sm:text-sm">
											<Trash2 size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Delete</span>
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{isOpen && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
					<div className="bg-white w-full max-w-sm sm:max-w-lg rounded-lg shadow-lg">
						<div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b">
							<h3 className="font-semibold text-sm sm:text-base">{editing ? 'Edit Room' : 'New Room'}</h3>
							<button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
						</div>
						<form onSubmit={save} className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
							<label>
								<span className="text-sm text-slate-600">Number</span>
								<input className="mt-1 w-full border rounded px-3 py-2" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
							</label>
							<label>
								<span className="text-sm text-slate-600">Type</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
									<option>Single</option>
									<option>Double</option>
									<option>Suite</option>
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

export default Rooms;
