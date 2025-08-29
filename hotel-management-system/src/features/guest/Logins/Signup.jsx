import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthProvider.jsx';

function GuestSignup() {
	const navigate = useNavigate();
	const { signup } = useAuth();
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await signup({ ...form, role: 'GUEST' });
			navigate('/guest');
		} catch (err) {
			setError(err.message || 'Failed to create account');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
			<form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-md shadow">
				<h1 className="text-xl font-semibold mb-4">Guest Sign up</h1>
				{error && <p className="text-rose-600 text-sm mb-2">{error}</p>}
				<label className="block mb-3">
					<span className="text-sm text-slate-600">Full name</span>
					<input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
				</label>
				<label className="block mb-3">
					<span className="text-sm text-slate-600">Email</span>
					<input type="email" className="mt-1 w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
				</label>
				<label className="block mb-4">
					<span className="text-sm text-slate-600">Password</span>
					<input type="password" className="mt-1 w-full border rounded px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
				</label>
				<button disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:opacity-60">{loading ? 'Creating...' : 'Create account'}</button>
				<p className="text-sm text-slate-600 mt-3">Already have an account? <Link to="/guest/signin" className="text-blue-600">Sign in</Link></p>
			</form>
		</div>
	);
}

export default GuestSignup;



