import { useEffect, useState } from 'react';
import http from '../../features/shared/services/http.js';

function GuestBookings() {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchBookings();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchBookings();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchBookings() {
		try {
			const data = await http.get('/guest/bookings');
			setBookings(data);
		} catch (error) {
			console.error('Failed to fetch bookings:', error);
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
			</div>
		);
	}

	return (
		<section className="space-y-4" data-aos="fade-up">
			<h2 className="text-lg sm:text-xl font-semibold">Your Bookings</h2>
			
			{bookings.length === 0 ? (
				<div className="text-center py-8 text-slate-500">
					<p>No bookings found. Start by making a reservation!</p>
				</div>
			) : (
				<div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
					<table className="min-w-full text-xs sm:text-sm">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="text-left p-2 sm:p-3">Booking #</th>
								<th className="text-left p-2 sm:p-3">Room</th>
								<th className="text-left p-2 sm:p-3 hidden sm:table-cell">Check-in</th>
								<th className="text-left p-2 sm:p-3 hidden sm:table-cell">Check-out</th>
								<th className="text-left p-2 sm:p-3">Status</th>
							</tr>
						</thead>
						<tbody>
							{bookings.map((b) => (
								<tr key={b.id} className="border-t">
									<td className="p-2 sm:p-3">{b.id}</td>
									<td className="p-2 sm:p-3">{b.room}</td>
									<td className="p-2 sm:p-3 hidden sm:table-cell">{b.checkIn}</td>
									<td className="p-2 sm:p-3 hidden sm:table-cell">{b.checkOut}</td>
									<td className="p-2 sm:p-3">
										<span className={`px-2 py-1 rounded text-xs ${
											b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
											b.status === 'Checked-in' ? 'bg-blue-100 text-blue-700' :
											b.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
											b.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
											'bg-amber-100 text-amber-700'
										}`}>
											{b.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

export default GuestBookings;


