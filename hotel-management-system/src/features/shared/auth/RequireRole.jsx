import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

function RequireRole({ role, redirectTo = '/guest/signin' }) {
	const { user, loading } = useAuth();
	if (loading) return null;
	if (!user) return <Navigate to={redirectTo} replace />;
	return user.role === role ? <Outlet /> : (
		<Navigate to={user.role === 'ADMIN' ? '/' : '/guest'} replace />
	);
}

export default RequireRole;




