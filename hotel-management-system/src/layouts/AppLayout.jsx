import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';

function AppLayout({ children }) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="flex min-h-screen">
			<Sidebar collapsed={collapsed} />
			<div className="flex-1 flex flex-col">
				<Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
				<main className="flex-1 bg-slate-100 p-3 sm:p-4 md:p-6 lg:p-8 mt-16 mb-16 md:mb-10 overflow-x-auto">
					<div className="w-full max-w-full mx-auto min-w-0">
						{children ?? <Outlet />}
					</div>
				</main>

				<div className="fixed bottom-0 left-0 right-0 bg-white shadow-sm border-t border-slate-200 px-3 sm:px-6 py-2 sm:py-4 z-40 text-center duration-500" 
					style={{
						left: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (collapsed ? '5rem' : '14rem') : '0'
					  }}>
					<footer className="text-xs sm:text-sm text-slate-500">
						<p>© {new Date().getFullYear()} Ahenkana Hotel</p>
					</footer>
				</div>
			</div>
		</div>
	);
}

export default AppLayout;
