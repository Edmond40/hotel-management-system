import http, { setAuthToken } from './http.js';

export async function signin({ email, password }) {
	const data = await http.post('/auth/signin', { email, password });
	setAuthToken(data.token);
	return data.user;
}

export async function signup(payload) {
	const data = await http.post('/auth/signup', payload);
	setAuthToken(data.token);
	return data.user;
}

export async function signout() {
	setAuthToken('');
}

export async function getProfile() {
	return http.get('/auth/me');
}

export default { signin, signup, signout, getProfile };


