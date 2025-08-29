import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import http from '../../features/shared/services/http.js';

function Reservations() {
	const [reservations, setReservations] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ userId: '', roomId: '', checkIn: '', checkOut: '', status: 'Pending' });
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState([]);
	const [rooms, setRooms] = useState([]);

	useEffect(() => { 
		fetchAll(); 
		fetchOptions();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchAll();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchAll() {
		try {
			const data = await http.get('/admin/reservations');
			setReservations(data);
		} catch (e) {
			console.error('Failed to load reservations', e.message || e);
		} finally {
			setLoading(false);
		}
	}

	async function fetchOptions() {
		try {
			const data = await http.get('/admin/reservations/options');
			setUsers(data.users);
			setRooms(data.rooms);
		} catch (e) {
			console.error('Failed to load options', e.message || e);
		}
	}

	const openForCreate = () => { 
		setEditing(null); 
		setForm({ userId: '', roomId: '', checkIn: '', checkOut: '', status: 'Pending' }); 
		setIsOpen(true); 
	};

	const openForEdit = (r) => { 
		setEditing(r); 
		setForm({ 
			userId: r.userId, 
			roomId: r.roomId, 
			checkIn: r.checkIn?.slice(0,10), 
			checkOut: r.checkOut?.slice(0,10), 
			status: r.status 
		}); 
		setIsOpen(true); 
	};

	async function remove(id) { 
		await http.delete(`/admin/reservations/${id}`); 
		fetchAll(); 
	}

	async function save(e) {
		e.preventDefault();
		if (editing) {
			await http.put(`/admin/reservations/${editing.id}`, form);
		} else {
			await http.post('/admin/reservations', form);
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
				<h2 className="text-2xl font-bold text-slate-900" data-aos="fade-left">Reservations</h2>
				<button onClick={openForCreate} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700" data-aos="fade-right">
					<Plus size={18} /> New Reservation
				</button>
			</div>

			<div className="bg-white rounded-lg border border-slate-200 overflow-hidden" data-aos="fade-up">
				<div className="overflow-x-auto w-full block">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="text-left p-2 md:p-3 whitespace-nowrap">User</th>
								<th className="text-left p-2 md:p-3 whitespace-nowrap">Room</th>
								<th className="text-left p-2 md:p-3 whitespace-nowrap">Check-in</th>
								<th className="text-left p-2 md:p-3 whitespace-nowrap">Check-out</th>
								<th className="text-left p-2 md:p-3 whitespace-nowrap">Status</th>
								<th className="text-right p-2 md:p-3 whitespace-nowrap">Actions</th>
							</tr>
						</thead>
						<tbody>
							{reservations.map((r) => (
								<tr key={r.id} className="border-t hover:bg-slate-50">
									<td className="p-2 md:p-3 whitespace-nowrap">{r.user?.name || r.userId}</td>
									<td className="p-2 md:p-3 whitespace-nowrap">{r.room?.number || r.roomId}</td>
									<td className="p-2 md:p-3 whitespace-nowrap">{new Date(r.checkIn).toLocaleDateString()}</td>
									<td className="p-2 md:p-3 whitespace-nowrap">{new Date(r.checkOut).toLocaleDateString()}</td>
									<td className="p-2 md:p-3 whitespace-nowrap">
										<span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
											r.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
											r.status === 'Checked-in' ? 'bg-blue-100 text-blue-700' : 
											'bg-amber-100 text-amber-700'
										}`}>
											{r.status}
										</span>
									</td>
									<td className="p-2 md:p-3 text-right whitespace-nowrap">
										<div className="flex items-center justify-end gap-1 md:gap-2">
											<button 
												onClick={() => openForEdit(r)} 
												className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs md:text-sm"
											>
												<Pencil size={14} /> 
												<span className="hidden sm:inline">Edit</span>
											</button>
											<button 
												onClick={() => remove(r.id)} 
												className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs md:text-sm"
											>
												<Trash2 size={14} /> 
												<span className="hidden sm:inline">Delete</span>
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{isOpen && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-lg rounded-lg shadow-lg" data-aos="zoom-in">
						<div className="flex items-center justify-between px-4 py-3 border-b">
							<h3 className="font-semibold">{editing ? 'Edit Reservation' : 'New Reservation'}</h3>
							<button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-800"><X size={18} /></button>
						</div>
						<form onSubmit={save} className="p-4 grid grid-cols-2 gap-3">
							<label>
								<span className="text-sm text-slate-600">User</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.userId} 
									onChange={(e) => setForm({ ...form, userId: e.target.value })} 
									required
								>
									<option value="">Select User</option>
									{users.map(user => (
										<option key={user.id} value={user.id}>
											{user.name} ({user.email})
										</option>
									))}
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Room</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.roomId} 
									onChange={(e) => setForm({ ...form, roomId: e.target.value })} 
									required
								>
									<option value="">Select Room</option>
									{rooms.map(room => (
										<option key={room.id} value={room.id}>
											Room {room.number} - {room.type} (${room.price})
										</option>
									))}
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Status</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
									<option>Pending</option>
									<option>Confirmed</option>
									<option>Checked-in</option>
								</select>
							</label>
							<label>
								<span className="text-sm text-slate-600">Check-in</span>
								<input type="date" className="mt-1 w-full border rounded px-3 py-2" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} required />
							</label>
							<label>
								<span className="text-sm text-slate-600">Check-out</span>
								<input type="date" className="mt-1 w-full border rounded px-3 py-2" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} required />
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

export default Reservations;
