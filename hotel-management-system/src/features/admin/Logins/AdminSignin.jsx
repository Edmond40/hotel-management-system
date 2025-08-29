import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthProvider.jsx';

function AdminSignin() {
	const navigate = useNavigate();
	const { signin } = useAuth();
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await signin(form);
			navigate('/');
		} catch (err) {
			setError(err.message || 'Invalid admin credentials');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
			<form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-md shadow">
				<h1 className="text-xl font-semibold mb-4">Admin Sign in</h1>
				{error && <p className="text-rose-600 text-sm mb-2">{error}</p>}
				<label className="block mb-3">
					<span className="text-sm text-slate-600">Email</span>
					<input type="email" className="mt-1 w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
				</label>
				<label className="block mb-4">
					<span className="text-sm text-slate-600">Password</span>
					<input type="password" className="mt-1 w-full border rounded px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
				</label>
				{/* <label className="block mb-4">
					<span className="text-sm text-slate-600">Authorization Code</span>
					<input type="auth-code" className="mt-1 w-full border rounded px-3 py-2" value={form.authCode} onChange={(e) => setForm({ ...form, authCode: e.target.value })} required />
				</label> */}
				<button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
				<p className="text-sm text-slate-600 mt-3">No admin account? <Link to="/admin/signup" className="text-blue-600">Create one</Link></p>
			</form>
		</div>
	);
}

export default AdminSignin;



