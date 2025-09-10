import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import http from '../../features/shared/services/http.js';
import { toast } from 'react-toastify';

function Reservations() {
	const [reservations, setReservations] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ 
		userId: '', 
		roomId: '', 
		checkIn: '', 
		checkOut: '', 
		status: 'PENDING' 
	});
	const [formErrors, setFormErrors] = useState({});
	const [availableRooms, setAvailableRooms] = useState([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
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
		setForm({ 
			userId: '', 
			roomId: '', 
			checkIn: '', 
			checkOut: '', 
			status: 'PENDING' 
		});
		setFormErrors({});
		setIsOpen(true); 
	};

	const openForEdit = async (reservation) => {
		try {
			setEditing(reservation.id);
			const [reservationDetails] = await Promise.all([
				http.get(`/admin/reservations/${reservation.id}`)
			]);

			// Format dates for the form
			const checkInDate = new Date(reservationDetails.checkIn).toISOString().split('T')[0];
			const checkOutDate = new Date(reservationDetails.checkOut).toISOString().split('T')[0];

			// Get current room details
			const currentRoom = await http.get(`/admin/rooms/${reservationDetails.roomId}`);

			setForm({ 
				userId: String(reservationDetails.userId), 
				roomId: String(reservationDetails.roomId), 
				checkIn: checkInDate,
				checkOut: checkOutDate,
				status: reservationDetails.status 
			});

			// Set available rooms to include the current room
			setAvailableRooms([{
				id: String(currentRoom.id),
				number: currentRoom.number,
				type: currentRoom.type,
				price: currentRoom.price
			}]);

			setIsOpen(true);
		} catch (error) {
			console.error('Error fetching reservation details:', error);
			toast.error('Failed to load reservation details');
		}
	};

	async function remove(id) { 
		await http.delete(`/admin/reservations/${id}`); 
		fetchAll(); 
	}

	const validateForm = () => {
		const errors = {};
		const today = new Date().toISOString().split('T')[0];
		
		if (!form.userId) errors.userId = 'Guest is required';
		if (!form.roomId) errors.roomId = 'Room is required';
		if (!form.checkIn) {
			errors.checkIn = 'Check-in date is required';
		} else if (form.checkIn < today) {
			errors.checkIn = 'Check-in date cannot be in the past';
		}
		if (!form.checkOut) {
			errors.checkOut = 'Check-out date is required';
		} else if (form.checkIn && form.checkOut <= form.checkIn) {
			errors.checkOut = 'Check-out date must be after check-in date';
		}
		
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const fetchAvailableRooms = async (checkIn, checkOut) => {
		try {
			setIsLoadingRooms(true);
			// Get fresh room data with availability for the selected dates
			const { rooms } = await http.get('/admin/reservations/options', {
				params: { checkIn, checkOut }
			});
			setAvailableRooms(rooms);
		} catch (error) {
			console.error('Error fetching available rooms:', error);
			toast.error('Failed to load available rooms');
		} finally {
			setIsLoadingRooms(false);
		}
	};

	const handleDateChange = async (field, value) => {
		const newForm = { ...form, [field]: value };
		setForm(newForm);
		
		// If both dates are selected, fetch available rooms
		if (newForm.checkIn && newForm.checkOut) {
			await fetchAvailableRooms(newForm.checkIn, newForm.checkOut);
			
			// If current room is not in available rooms, clear it
			if (newForm.roomId && !availableRooms.some(r => r.id === newForm.roomId)) {
				setForm(prev => ({ ...prev, roomId: '' }));
			}
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		try {
			const payload = {
				...form,
				userId: parseInt(form.userId, 10),
				roomId: parseInt(form.roomId, 10)
			};

			if (editing) {
				await http.put(`/admin/reservations/${editing}`, payload);
				toast.success('Reservation updated successfully');
			} else {
				await http.post('/admin/reservations', payload);
				toast.success('Reservation created successfully');
			}
			
			setIsOpen(false);
			fetchAll();
		} catch (error) {
			console.error('Failed to save reservation:', error);
			const errorMessage = error.response?.data?.error || 'Failed to save reservation';
			toast.error(errorMessage);
			
			// Show detailed error if there are conflicting reservations
			if (error.response?.data?.conflictingReservations) {
				setFormErrors({
					...formErrors,
					roomId: 'Room is already booked for the selected dates',
					conflicts: error.response.data.conflictingReservations
				});
			}
		}
	};

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
						<form onSubmit={handleSubmit} className="p-4 grid grid-cols-2 gap-3">
							<label>
								<div className="space-y-1">
									<div className="flex items-center">
										<label className="block text-sm font-medium text-gray-700">Guest</label>
										{formErrors.userId && (
											<AlertCircle className="ml-1 h-4 w-4 text-red-500" />
										)}
									</div>
									<select
										className={`mt-1 block w-full rounded-md ${
											formErrors.userId ? 'border-red-300' : 'border-gray-300'
										} shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm`}
										value={form.userId}
										onChange={(e) => setForm({ ...form, userId: e.target.value })}
									>
										<option value="">Select Guest</option>
										{users.map((user) => (
											<option key={user.id} value={user.id}>
												{user.name} ({user.email})
											</option>
										))}
									</select>
									{formErrors.userId && (
										<p className="mt-1 text-sm text-red-600">{formErrors.userId}</p>
									)}
								</div>
							</label>
							<label>
								<div className="space-y-1">
									<div className="flex items-center">
										<label className="block text-sm font-medium text-gray-700">Room</label>
										{formErrors.roomId && (
											<AlertCircle className="ml-1 h-4 w-4 text-red-500" />
										)}
									</div>
									<select
										className={`mt-1 block w-full rounded-md ${
											formErrors.roomId ? 'border-red-300' : 'border-gray-300'
										} shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm`}
										value={form.roomId}
										onChange={(e) => setForm({ ...form, roomId: e.target.value })}
										disabled={isLoadingRooms}
									>
										<option value="">
											{isLoadingRooms ? 'Loading rooms...' : 'Select Room'}
										</option>
										{availableRooms.length > 0 ? (
											availableRooms.map((room) => (
												<option key={room.id} value={room.id}>
													Room {room.number} - {room.type} (₵{room.price || 'N/A'})
												</option>
											))
										) : (
											<option disabled>No available rooms for selected dates</option>
										)}
									</select>
									{formErrors.roomId && (
										<p className="mt-1 text-sm text-red-600">{formErrors.roomId}</p>
									)}
									{formErrors.conflicts && (
										<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
											<p className="text-sm text-red-600 font-medium">Conflicting Reservations:</p>
											<ul className="list-disc list-inside text-sm text-red-600 mt-1">
												{formErrors.conflicts.map((conflict, idx) => (
													<li key={idx}>
														{new Date(conflict.checkIn).toLocaleDateString()} - {new Date(conflict.checkOut).toLocaleDateString()}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</label>
							<label>
								<div className="space-y-1">
									<label className="block text-sm font-medium text-gray-700">Check-in</label>
									<input
										type="date"
										className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
										value={form.checkIn}
										onChange={(e) => {
											handleDateChange('checkIn', e.target.value);
											// Reset room selection when dates change
											setForm(prev => ({ ...prev, roomId: '' }));
										}}
										min={new Date().toISOString().split('T')[0]}
										disabled={isLoadingRooms}
									/>
									{formErrors.checkIn && (
										<p className="mt-1 text-sm text-red-600">{formErrors.checkIn}</p>
									)}
								</div>
							</label>
							<label>
								<div className="space-y-1">
									<label className="block text-sm font-medium text-gray-700">Check-out</label>
									<input
										type="date"
										className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
										value={form.checkOut}
										onChange={(e) => {
											handleDateChange('checkOut', e.target.value);
											// Reset room selection when dates change
											setForm(prev => ({ ...prev, roomId: '' }));
										}}
										min={form.checkIn || new Date().toISOString().split('T')[0]}
										disabled={!form.checkIn || isLoadingRooms}
									/>
									{formErrors.checkOut && (
										<p className="mt-1 text-sm text-red-600">{formErrors.checkOut}</p>
									)}
								</div>
							</label>
							<label>
								<span className="text-sm text-slate-600">Status</span>
								<select className="mt-1 w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
									<option>Pending</option>
									<option>Confirmed</option>
									<option>Checked-in</option>
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

export default Reservations;
