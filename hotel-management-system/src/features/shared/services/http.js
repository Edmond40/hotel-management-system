const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getAuthToken() {
	return localStorage.getItem('auth_token') || '';
}

export function setAuthToken(token) {
	if (token) localStorage.setItem('auth_token', token);
	else localStorage.removeItem('auth_token');
}

async function request(path, options = {}) {
	const headers = new Headers(options.headers || {});
	headers.set('Content-Type', 'application/json');
	const token = getAuthToken();
	if (token) headers.set('Authorization', `Bearer ${token}`);

	const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
	if (!res.ok) {
		let message = `HTTP ${res.status}`;
		try {
			const data = await res.json();
			message = data.message || message;
		} catch (err) { 
			console.log(err);
		}
		throw new Error(message);
	}
	if (res.status === 204) return null;
	return res.json();
}

export const http = {
	get: (p) => request(p, { method: 'GET' }),
	post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
	put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
	patch: (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: (p) => request(p, { method: 'DELETE' }),
};

export default http;
