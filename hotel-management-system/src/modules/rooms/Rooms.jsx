import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle, Wrench, Droplets } from 'lucide-react';
import http from '../../features/shared/services/http';
import { toast } from 'react-toastify';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'FAMILY'];
const ROOM_STATUS = {
    AVAILABLE: { label: 'Available', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    OCCUPIED: { label: 'Occupied', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-800', icon: Wrench },
    CLEANING: { label: 'Cleaning', color: 'bg-blue-100 text-blue-800', icon: Droplets }
};

function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ 
        number: '', 
        type: 'SINGLE', 
        price: 0, 
        status: 'AVAILABLE',
        capacity: 1,
        description: '',
        amenities: []
    });
    
    // Fetch rooms from the backend
    useEffect(() => {
        let isMounted = true;
        
        const loadRooms = async () => {
            if (isMounted) {
                await fetchRooms();
            }
        };
        
        loadRooms();
        
        // Set up polling to refresh room status periodically
        const intervalId = setInterval(loadRooms, 30000); // Refresh every 30 seconds
        
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const openForCreate = () => {
        setEditing(null);
        setForm({ 
            number: '', 
            type: 'SINGLE', 
            price: 0, 
            status: 'AVAILABLE',
            capacity: 1,
            description: '',
            amenities: []
        });
        setIsOpen(true);
    };

    const openForEdit = (room) => {
        setEditing(room);
        setForm({
            number: room.number,
            type: room.type,
            price: room.price,
            status: room.status,
            capacity: room.capacity,
            description: room.description || '',
            amenities: room.amenities || []
        });
        setIsOpen(true);
    };

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const { data } = await http.get('/admin/rooms');
            // Ensure all rooms have a valid status, default to 'AVAILABLE' if missing
            const roomsWithStatus = data.map(room => ({
                ...room,
                status: room.status || 'AVAILABLE',
                type: room.type || 'SINGLE',
                price: room.price || 0,
                capacity: room.capacity || 1,
                description: room.description || ''
            }));
            setRooms(roomsWithStatus);
            return roomsWithStatus;
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            toast.error('Failed to load rooms');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await http.delete(`/admin/rooms/${id}`);
                await fetchRooms();
                toast.success('Room deleted successfully');
            } catch (error) {
                console.error('Failed to delete room:', error);
                toast.error('Failed to delete room');
            }
        }
    };

    const handleStatusChange = async (roomId, newStatus) => {
        try {
            // Find the room to update
            const roomToUpdate = rooms.find(r => r.id === roomId);
            if (!roomToUpdate) {
                toast.error('Room not found');
                return;
            }
            
            // Update the room status
            await http.put(`/admin/rooms/${roomId}`, { 
                ...roomToUpdate,
                status: newStatus,
                // Make sure to include all required fields in the update
                number: roomToUpdate.number,
                type: roomToUpdate.type,
                price: roomToUpdate.price,
                capacity: roomToUpdate.capacity,
                description: roomToUpdate.description || '',
                amenities: Array.isArray(roomToUpdate.amenities) 
                    ? roomToUpdate.amenities.join(',') 
                    : (roomToUpdate.amenities || '')
            });
            
            // Refresh the rooms list to ensure consistency
            await fetchRooms();
            
            toast.success(`Room status updated to ${ROOM_STATUS[newStatus]?.label || newStatus}`);
        } catch (error) {
            console.error('Failed to update room status:', error);
            toast.error(error.response?.data?.error || 'Failed to update room status');
            
            // Revert the status in the UI if the update fails
            const roomToRevert = rooms.find(r => r.id === roomId);
            if (roomToRevert) {
                setRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === roomId 
                            ? { ...room, status: roomToRevert.status }
                            : room
                    )
                );
            }
        }
    };

    const save = async (e) => {
        e.preventDefault();
        
        try {
            const payload = {
                ...form,
                price: Number(form.price) || 0,
                capacity: Number(form.capacity) || 1,
                status: form.status || 'AVAILABLE',
                type: form.type || 'SINGLE',
                description: form.description || '',
                amenities: Array.isArray(form.amenities) ? form.amenities.join(',') : ''
            };
            
            if (editing) {
                await http.put(`/admin/rooms/${editing.id}`, payload);
                toast.success('Room updated successfully');
            } else {
                await http.post('/admin/rooms', payload);
                toast.success('Room created successfully');
            }
            
            setIsOpen(false);
            // Refresh the rooms list
            const { data } = await http.get('/admin/rooms');
            // Ensure all rooms have a valid status, default to 'AVAILABLE' if missing
            const roomsWithStatus = data.map(room => ({
                ...room,
                status: room.status || 'AVAILABLE',
                type: room.type || 'SINGLE',
                price: room.price || 0,
                capacity: room.capacity || 1,
                description: room.description || ''
            }));
            setRooms(roomsWithStatus);
        } catch (error) {
            console.error('Failed to save room:', error);
            toast.error(error.response?.data?.error || 'Failed to save room');
        }
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
							<th className="text-left p-2 sm:p-3">Room</th>
							<th className="text-left p-2 sm:p-3">Type</th>
							<th className="text-left p-2 sm:p-3">Description</th>
							<th className="text-left p-2 sm:p-3">Price</th>
							<th className="text-left p-2 sm:p-3">Status</th>
							<th className="text-right p-2 sm:p-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan="6" className="p-4 text-center">
									<div className="flex justify-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
									</div>
								</td>
							</tr>
						) : rooms.length === 0 ? (
							<tr>
								<td colSpan="6" className="p-4 text-center text-gray-500">
									No rooms found. Create your first room to get started.
								</td>
							</tr>
						) : (
							rooms.map((room) => {
								const status = ROOM_STATUS[room.status] || ROOM_STATUS.AVAILABLE;
								const StatusIcon = status.icon;
								
								return (
									<tr key={room.id} className="border-t hover:bg-slate-50 group">
										<td className="p-2 sm:p-3 font-medium">
											<div className="font-semibold flex items-center gap-2">
												<StatusIcon className="h-4 w-4 text-gray-400" />
												Room {room.number}
											</div>
											{room.amenities?.length > 0 && (
												<div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
													{room.amenities.map((amenity, index) => (
														<span key={index} className="bg-gray-100 px-2 py-0.5 rounded-full">
															{amenity}
														</span>
													))}
												</div>
											)}
										</td>
										<td className="p-2 sm:p-3">
											<div className="font-medium">{room.type}</div>
											<div className="text-xs text-gray-500">Capacity: {room.capacity || 1} {room.capacity === 1 ? 'person' : 'people'}</div>
										</td>
										<td className="p-2 sm:p-3 text-sm text-gray-600 max-w-xs">
											{room.description ? (
												<div className="relative group/desc">
													<div className="line-clamp-2">
														{room.description}
													</div>
													{room.description.length > 100 && (
														<div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 group-hover/desc:opacity-100 transition-opacity flex items-end justify-center">
															<button 
																onClick={() => {
																	alert(room.description);
																}}
																className="text-xs text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm"
															>
																Read more
															</button>
														</div>
													)}
												</div>
											) : (
												<span className="text-gray-400 italic">No description</span>
											)}
										</td>
										<td className="p-2 sm:p-3 font-medium">
											₵{room.price?.toLocaleString() || '0.00'}
										</td>
										<td className="p-2 sm:p-3">
											<div className="flex items-center gap-2">
												<StatusIcon className="h-4 w-4" />
												<span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
													{status.label}
												</span>
											</div>
										</td>
										<td className="p-2 sm:p-3 text-right">
											<div className="flex justify-end gap-2">
												<select
													value={room.status}
													onChange={(e) => handleStatusChange(room.id, e.target.value)}
													className="text-xs rounded border-gray-300 py-1 pr-6 pl-2 focus:ring-emerald-500 focus:border-emerald-500"
												>
													{Object.entries(ROOM_STATUS).map(([key, { label }]) => (
														<option key={key} value={key}>
															{label}
														</option>
													))}
												</select>
												<button 
													onClick={() => openForEdit(room)}
													className="text-blue-600 hover:text-blue-700 p-1"
													title="Edit room"
												>
													<Pencil size={16} />
												</button>
												<button 
													onClick={() => remove(room.id)}
													className="text-rose-600 hover:text-rose-700 p-1"
													title="Delete room"
												>
													<Trash2 size={16} />
												</button>
											</div>
										</td>
									</tr>
								);
							})
						)}
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
							<label className="col-span-2">
								<span className="text-sm text-slate-600">Room Number</span>
								<input 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.number} 
									onChange={(e) => setForm({ ...form, number: e.target.value })} 
									required 
								/>
							</label>

							<label>
								<span className="text-sm text-slate-600">Type</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.type} 
									onChange={(e) => setForm({ ...form, type: e.target.value })}
									required
								>
									{ROOM_TYPES.map(type => (
										<option key={type} value={type}>
											{type.charAt(0) + type.slice(1).toLowerCase()}
										</option>
									))}
								</select>
							</label>

							<label>
								<span className="text-sm text-slate-600">Status</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.status}
									onChange={(e) => setForm({ ...form, status: e.target.value })}
								>
									{Object.entries(ROOM_STATUS).map(([key, { label }]) => (
										<option key={key} value={key}>{label}</option>
									))}
								</select>
							</label>

							<label>
								<span className="text-sm text-slate-600">Price (₵)</span>
								<input 
									type="number" 
									className="mt-1 w-full border rounded px-3 py-2" 
									value={form.price} 
									onChange={(e) => setForm({ ...form, price: e.target.value })} 
									min="0"
									step="0.01"
									required 
								/>
							</label>

							<label>
								<span className="text-sm text-slate-600">Capacity</span>
								<select 
									className="mt-1 w-full border rounded px-3 py-2"
									value={form.capacity}
									onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) })}
								>
									{[1, 2, 3, 4, 5, 6].map(num => (
										<option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
									))}
								</select>
							</label>

							<label className="col-span-2">
								<span className="text-sm text-slate-600">Description</span>
								<textarea 
									className="mt-1 w-full border rounded px-3 py-2" 
									rows="3"
									value={form.description}
									onChange={(e) => setForm({ ...form, description: e.target.value })}
								></textarea>
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
