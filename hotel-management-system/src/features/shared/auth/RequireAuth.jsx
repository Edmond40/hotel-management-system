import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

function RequireAuth({ redirectTo = '/guest/signin' }) {
	const { user, loading } = useAuth();
	if (loading) return null;
	return user ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

export default RequireAuth;



