import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, setAuthToken } from '../services/http.js';
import authApi from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = getAuthToken();
		if (!token) { setLoading(false); return; }
		authApi.getProfile()
			.then((u) => setUser(u))
			.catch(() => setAuthToken(''))
			.finally(() => setLoading(false));
	}, []);

	async function signin(credentials) {
		const u = await authApi.signin(credentials);
		setUser(u);
		return u;
	}

	async function signup(payload) {
		const u = await authApi.signup(payload);
		setUser(u);
		return u;
	}

	async function signout() {
		await authApi.signout();
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, signin, signup, signout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

export default AuthProvider;



