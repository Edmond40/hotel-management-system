import { useState, useEffect } from 'react';
import http from '../../features/shared/services/http.js';
import { formatTime } from '../../utils/dateUtils.js';

function GuestRequests() {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchRequests();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchRequests();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchRequests() {
		try {
			setLoading(true);
			const data = await http.get('/guest/requests');
			setRequests(data);
			setError(null);
		} catch (error) {
			console.error('Failed to fetch requests:', error);
			setError('Failed to load requests');
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<section className="space-y-4" data-aos="fade-up">
				<h2 className="text-xl font-semibold">Your Requests</h2>
				<div className="flex items-center justify-center h-32">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="space-y-4" data-aos="fade-up">
				<h2 className="text-xl font-semibold">Your Requests</h2>
				<div className="text-center py-8 text-red-500">
					<p>{error}</p>
					<button 
						onClick={fetchRequests}
						className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
					>
						Retry
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-4" data-aos="fade-up">
			<h2 className="text-xl font-semibold">Your Requests</h2>
			
			{requests.length === 0 ? (
				<div className="text-center py-8 text-slate-500">
					<p>No requests found. Make your first meal request from the Menu page!</p>
				</div>
			) : (
				<ul className="space-y-2">
					{requests.map((request) => (
						<li key={request.id} className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between">
							<div>
								<div className="font-medium">
									{request.menuItem ? `Meal: ${request.menuItem.name}` : 'Service Request'}
								</div>
								<div className="text-sm text-slate-600">
									{request.menuItem && request.menuItem.price && (
										<span>
											Quantity: {request.quantity || 1} • $
											{(typeof request.menuItem.price === 'number' && typeof request.quantity === 'number' 
												? (request.menuItem.price * request.quantity).toFixed(2) 
												: '0.00'
											)}
										</span>
									)}
									{request.specialInstructions && (
										<div className="mt-1 text-xs text-slate-500">
											Note: {request.specialInstructions}
										</div>
									)}
								</div>
							</div>
							<div className="text-sm text-slate-500 flex items-center gap-3">
								<span>{formatTime(request.createdAt)}</span>
								<span className={`px-2 py-1 rounded text-xs font-medium ${
									request.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
									request.status === 'Confirmed' ? 'bg-blue-50 text-blue-700' :
									request.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
									'bg-red-50 text-red-700'
								}`}>
									{request.status || 'Unknown'}
								</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export default GuestRequests;
