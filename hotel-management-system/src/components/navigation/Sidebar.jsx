import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, BedDouble, Users, BadgePercent, Receipt, Settings, MapPinHouse, User, Utensils, HandPlatter, Menu, X } from 'lucide-react';

const navItems = [
	{ to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
	{ to: '/reservations', label: 'Reservations', icon: <CalendarCheck size={20} /> },
	{ to: '/rooms', label: 'Rooms', icon: <BedDouble size={20} /> },
	{ to: '/guests', label: 'Guests', icon: <Users size={20} /> },
	{ to: '/customers', label: 'Customers', icon: <User size={20} /> },
	{ to: '/staff', label: 'Staff', icon: <BadgePercent size={20} /> },
	{ to: '/restaurant', label: 'Restaurant', icon: <Utensils size={20} /> },
	{ to: '/requests', label: 'Requests', icon: <HandPlatter size={20} /> },
	{ to: '/billing', label: 'Billing', icon: <Receipt size={20} /> },
	{ to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

function Sidebar({ collapsed = false }) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			{/* Mobile Menu Button */}
			<button 
				className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-slate-200"
				onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
			>
				{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
			</button>

			{/* Mobile Overlay */}
			{mobileMenuOpen && (
				<div 
					className="md:hidden fixed inset-0 backdrop-brightness-75 z-40"
					onClick={() => setMobileMenuOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside className={`
				bg-white h-screen overflow-y-auto overflow-x-hidden py-4 border-r border-slate-200 transition-all duration-500 ease-in-out z-50
				${mobileMenuOpen 
					? 'fixed left-0 top-0 w-64 px-3' 
					: 'hidden md:block md:sticky md:top-0'
				}
				${collapsed ? 'lg:w-20 lg:px-2 md:w-16 md:px-2 w-64' : 'lg:w-60 lg:px-3 md:w-16 w-64'}
			`}>
				{/* Header */}
				<div className={`flex items-center ${
					mobileMenuOpen ? 'gap-2' : (collapsed ? 'justify-center' : 'gap-2')
				} text-emerald-600 transition-all px-3 py-3 mb-4`}>
					<MapPinHouse size={24} className='text-yellow-400 flex-shrink-0' />
					<span className={`berkshire-swash-bold overflow-hidden transition-all duration-500 text-sm sm:text-base ${
						mobileMenuOpen ? 'block' : (collapsed ? 'hidden lg:block' : 'hidden lg:block')
					} ${
						(collapsed && !mobileMenuOpen) ? 'w-0 opacity-0' : 'w-auto opacity-100'
					}`}>
						Ahenkana Hotel
					</span>
				</div>

				{/* Navigation */}
				<nav className="space-y-1">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								`flex items-center ${
									mobileMenuOpen ? 'gap-3 px-3' : (collapsed ? 'justify-center px-2' : 'gap-3 px-3')
								} py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
									isActive 
										? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
								}`
							}
							end={item.to === '/'}
							onClick={() => setMobileMenuOpen(false)}>
							<span className="flex-shrink-0">
								{React.cloneElement(item.icon, { 
									size: 20,
									className: "transition-colors duration-200"
								})}
							</span>
							<span className={`font-medium text-xs sm:text-sm transition-all duration-500 ${
								mobileMenuOpen ? 'block w-auto opacity-100' : (collapsed ? 'hidden lg:block w-0 opacity-0' : 'hidden lg:block w-auto opacity-100')
							}`}>
								{item.label}
							</span>
						</NavLink>
					))}
				</nav>
			</aside>
		</>
	);
}

export default Sidebar;
