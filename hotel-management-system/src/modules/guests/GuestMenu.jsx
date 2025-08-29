import { useEffect, useState } from 'react';
import http from '../../features/shared/services/http.js';

function GuestMenu() {
	const [menuItems, setMenuItems] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [orderingItem, setOrderingItem] = useState(null);

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
			setLoading(true);
			const data = await http.get('/guest/menu');
			setMenuItems(data);
			setError(null);
		} catch (error) {
			console.error('Failed to fetch menu:', error);
			setError('Failed to load menu');
		} finally {
			setLoading(false);
		}
	}

	async function handleOrder(menuItemId, quantity = 1, specialInstructions = '') {
		try {
			setOrderingItem(menuItemId);
			await http.post('/guest/requests', {
				menuItemId,
				quantity,
				specialInstructions
			});
			alert('Order placed successfully!');
		} catch (error) {
			console.error('Failed to place order:', error);
			alert('Failed to place order. Please try again.');
		} finally {
			setOrderingItem(null);
		}
	}

	if (loading) {
		return (
			<section className="space-y-6" data-aos="fade-up">
				<div>
					<h1 className="text-2xl font-semibold">Restaurant Menu</h1>
					<p className="text-slate-600">Explore our delicious menu offerings</p>
				</div>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="space-y-6" data-aos="fade-up">
				<div>
					<h1 className="text-2xl font-semibold">Restaurant Menu</h1>
					<p className="text-slate-600">Explore our delicious menu offerings</p>
				</div>
				<div className="text-center py-8 text-red-500">
					<p>{error}</p>
					<button 
						onClick={fetchMenu}
						className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
					>
						Retry
					</button>
				</div>
			</section>
		);
	}

	const categories = Object.keys(menuItems);

	return (
		<section className="space-y-6" data-aos="fade-up">
			<div>
				<h1 className="text-xl sm:text-2xl font-semibold">Restaurant Menu</h1>
				<p className="text-sm sm:text-base text-slate-600">Explore our delicious menu offerings</p>
			</div>

			{categories.length === 0 ? (
				<div className="text-center py-8 text-slate-500">
					<p>No menu items available at the moment.</p>
				</div>
			) : (
				<div className="space-y-6">
					{categories.map(category => (
						<div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
							<div className="bg-slate-50 px-3 sm:px-4 py-3 border-b">
								<h2 className="text-base sm:text-lg font-semibold text-slate-800">{category}</h2>
							</div>
							<div className="p-3 sm:p-4">
								<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
									{menuItems[category].map(item => (
										<div key={item.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
											<div className="flex justify-between items-start mb-2">
												<h3 className="font-medium text-slate-900">{item.name}</h3>
												<span className="text-emerald-600 font-semibold">${item.price.toFixed(2)}</span>
											</div>
											{item.description && (
												<p className="text-sm text-slate-600 mb-3">{item.description}</p>
											)}
											<div className="flex justify-between items-center">
												<span className={`text-xs px-2 py-1 rounded ${
													item.available 
														? 'text-emerald-700 bg-emerald-50' 
														: 'text-red-700 bg-red-50'
												}`}>
													{item.available ? 'Available' : 'Unavailable'}
												</span>
												{item.available && (
													<button
														onClick={() => handleOrder(item.id)}
														disabled={orderingItem === item.id}
														className={`px-3 py-1 text-sm rounded transition-colors ${
															orderingItem === item.id
																? 'bg-slate-300 text-slate-500 cursor-not-allowed'
																: 'bg-emerald-500 text-white hover:bg-emerald-600'
														}`}
													>
														{orderingItem === item.id ? 'Ordering...' : 'Order'}
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

export default GuestMenu;
