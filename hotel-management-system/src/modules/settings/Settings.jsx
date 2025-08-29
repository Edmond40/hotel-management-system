import { useEffect, useState } from 'react';
import { Save, Building, MapPin, DollarSign, Percent } from 'lucide-react';

const STORAGE_KEY = 'hotel-settings';

function Settings() {
	const [form, setForm] = useState({ 
		name: 'Ahenkana Hotel', 
		address: 'Accra, Ghana', 
		currency: 'GHS', 
		taxRate: 12.5,
		phone: '+233 20 123 4567',
		email: 'info@ahenkanahotel.com',
		checkInTime: '14:00',
		checkOutTime: '11:00'
	});
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setForm(prev => ({ ...prev, ...parsed }));
			} catch (e) {
				console.error('Failed to parse saved settings');
			}
		}
	}, []);

	const save = (e) => {
		e.preventDefault();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<h2 className="text-2xl font-bold text-slate-900" data-aos="zoom-in">Hotel Settings</h2>
				{saved && (
					<span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
						<Save size={16} /> Settings saved!
					</span>
				)}
			</div>
			
			<form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-2 gap-6 max-w-4xl shadow-md" data-aos="fade-left">
				<label className="col-span-2 flex items-center gap-2">
					<Building size={20} className="text-slate-500" />
					<span className="text-sm font-medium text-slate-700">Hotel Name</span>
					<input 
						className="ml-auto flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.name} 
						onChange={(e) => setForm({ ...form, name: e.target.value })} 
					/>
				</label>
				
				<label className="col-span-2 flex items-center gap-2">
					<MapPin size={20} className="text-slate-500" />
					<span className="text-sm font-medium text-slate-700">Address</span>
					<textarea 
						className="ml-auto flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.address} 
						onChange={(e) => setForm({ ...form, address: e.target.value })} 
						rows={2}
					/>
				</label>
				
				<label className="flex items-center gap-2">
					<DollarSign size={20} className="text-slate-500" />
					<span className="text-sm font-medium text-slate-700">Currency</span>
					<select 
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.currency} 
						onChange={(e) => setForm({ ...form, currency: e.target.value })}
					>
						<option value="GHS">GHS (Ghana Cedi)</option>
						<option value="USD">USD (US Dollar)</option>
						<option value="EUR">EUR (Euro)</option>
						<option value="GBP">GBP (British Pound)</option>
					</select>
				</label>
				
				<label className="flex items-center gap-2">
					<Percent size={20} className="text-slate-500" />
					<span className="text-sm font-medium text-slate-700">Tax Rate (%)</span>
					<input 
						type="number" 
						min="0" 
						max="100"
						step="0.1"
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.taxRate} 
						onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} 
					/>
				</label>
				
				<label className="flex items-center gap-2">
					<span className="text-sm font-medium text-slate-700">Phone</span>
					<input 
						type="tel" 
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.phone} 
						onChange={(e) => setForm({ ...form, phone: e.target.value })} 
					/>
				</label>
				
				<label className="flex items-center gap-2">
					<span className="text-sm font-medium text-slate-700">Email</span>
					<input 
						type="email" 
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.email} 
						onChange={(e) => setForm({ ...form, email: e.target.value })} 
					/>
				</label>
				
				<label className="flex items-center gap-2">
					<span className="text-sm font-medium text-slate-700">Check-in Time</span>
					<input 
						type="time" 
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.checkInTime} 
						onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} 
					/>
				</label>
				
				<label className="flex items-center gap-2">
					<span className="text-sm font-medium text-slate-700">Check-out Time</span>
					<input 
						type="time" 
						className="ml-auto border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
						value={form.checkOutTime} 
						onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} 
					/>
				</label>
				
				<div className="col-span-2 flex justify-end pt-4">
					<button 
						type="submit" 
						className="px-6 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
					>
						<Save size={18} /> Save Settings
					</button>
				</div>
			</form>
		</div>
	);
}

export default Settings;
