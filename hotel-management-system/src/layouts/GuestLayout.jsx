import { MapPinHouse, LogOut } from 'lucide-react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/shared/auth/AuthProvider.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';

function GuestLayout({ children }) {
	const { signout } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await signout();
		navigate('/guest/signin');
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<header className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-200 px-3 sm:px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo and Brand */}
					<div className="flex items-center gap-2 text-emerald-600">
						<MapPinHouse size={24} className='text-yellow-400 sm:w-7 sm:h-7' />
						<span className="text-sm sm:text-lg berkshire-swash-bold overflow-hidden transition-all duration-300">
							<span className="hidden sm:inline">Ahenkana Hotel</span>
							<span className="sm:hidden">Ahenkana</span>
						</span>
					</div>
					
					{/* Navigation - Hidden on mobile, shown on tablet+ */}
					<nav className="hidden md:flex text-sm font-medium lg:text-base text-slate-600 gap-2 lg:gap-4 items-center justify-between">
						<NavLink to="/guest" end className={({isActive}) => `px-2 py-1 rounded hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : ''}`}>Overview</NavLink>
						<NavLink to="/guest/menu" className={({isActive}) => `px-2 py-1 rounded hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-600  bg-emerald-50' : ''}`}>Menu</NavLink>
						<NavLink to="/guest/bookings" className={({isActive}) => `px-2 py-1 rounded hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-600  bg-emerald-50' : ''}`}>Bookings</NavLink>
						<NavLink to="/guest/requests" className={({isActive}) => `px-2 py-1 rounded hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-600  bg-emerald-50' : ''}`}>Requests</NavLink>
						<NavLink to="/guest/payments" className={({isActive}) => `px-2 py-1 rounded hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-600  bg-emerald-50' : ''}`}>Payments</NavLink>
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-1 sm:gap-2">
						<NotificationBell />
						<button onClick={handleLogout} className="inline-flex items-center gap-1 sm:gap-2 cursor-pointer text-rose-600 hover:text-rose-700 font-semibold group text-sm sm:text-base">
							<LogOut size={16} className='sm:w-5 sm:h-5 animate-pulse group-hover:translate-x-1 duration-300'/> 
							<span className="hidden sm:inline">Logout</span>
						</button>
					</div>
				</div>
			</header>

			{/* Mobile Navigation */}
			<nav className="md:hidden bg-white border-b border-slate-200 px-3 py-2 overflow-x-auto">
				<div className="flex gap-1 min-w-max">
					<NavLink to="/guest" end className={({isActive}) => `px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}>Overview</NavLink>
					<NavLink to="/guest/menu" className={({isActive}) => `px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}>Menu</NavLink>
					<NavLink to="/guest/bookings" className={({isActive}) => `px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}>Bookings</NavLink>
					<NavLink to="/guest/requests" className={({isActive}) => `px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}>Requests</NavLink>
					<NavLink to="/guest/payments" className={({isActive}) => `px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}>Payments</NavLink>
				</div>
			</nav>

			<main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 mb-16">
				{children ?? <Outlet />}
			</main>
			<footer className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 text-center text-xs text-slate-500 bg-green-100"> {new Date().getFullYear()} Ahenkana Hotel</footer>
		</div>
	);
}

export default GuestLayout;
