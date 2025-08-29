import { useState, useEffect } from 'react';
import http from '../../features/shared/services/http.js';
import { formatDate } from '../../utils/dateUtils.js';

function GuestPayments() {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchPayments();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchPayments();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	async function fetchPayments() {
		try {
			setLoading(true);
			const data = await http.get('/guest/payments');
			setInvoices(data);
			setError(null);
		} catch (error) {
			console.error('Failed to fetch payments:', error);
			setError('Failed to load payment history');
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<section className="space-y-4" data-aos="fade-up">
				<h2 className="text-xl font-semibold">Payments</h2>
				<div className="flex items-center justify-center h-32">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="space-y-4" data-aos="fade-up">
				<h2 className="text-xl font-semibold">Payments</h2>
				<div className="text-center py-8 text-red-500">
					<p>{error}</p>
					<button 
						onClick={fetchPayments}
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
			<h2 className="text-xl font-semibold">Payments</h2>
			
			{invoices.length === 0 ? (
				<div className="text-center py-8 text-slate-500">
					<p>No payment history found.</p>
				</div>
			) : (
				<div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="text-left p-3">Invoice #</th>
								<th className="text-left p-3">Date</th>
								<th className="text-left p-3">Amount</th>
								<th className="text-left p-3">Status</th>
							</tr>
						</thead>
						<tbody>
							{invoices.map((invoice) => (
								<tr key={invoice.id} className="border-t">
									<td className="p-3 font-mono">
										INV-{(invoice.id || 0).toString().padStart(4, '0')}
									</td>
									<td className="p-3">
										{formatDate(invoice.createdAt)}
									</td>
									<td className="p-3 font-semibold">
										${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : '0.00'}
									</td>
									<td className="p-3">
										<span className={`px-2 py-1 rounded text-xs font-medium ${
											invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
											invoice.status === 'Unpaid' ? 'bg-red-50 text-red-700' :
											'bg-amber-50 text-amber-700'
										}`}>
											{invoice.status || 'Unknown'}
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

export default GuestPayments;
