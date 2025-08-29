import './index.css'
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './features/admin/layouts/AdminLayout';
import GuestLayout from './features/guest/layouts/GuestLayout';
import Dashboard from './modules/dashboard/Dashboard';
import RoomManagement from './modules/rooms/RoomManagement'; // Make sure this import exists
import Reservations from './modules/reservations/Reservations';
import Guests from './modules/guests/Guests';
import Staff from './modules/staff/Staff';
import Billing from './modules/billing/Billing';
import Settings from './modules/settings/Settings';
import Restaurant from './modules/restaurant/Restaurant';
import AdminRequests from './pages/admin/AdminRequests';
import Profile from './modules/profile/Profile';
import GuestHome from './modules/guests/GuestHome';
import GuestMenu from './modules/guests/GuestMenu';
import GuestBookings from './modules/guests/GuestBookings';
import GuestRequests from './modules/guests/GuestRequests';
import GuestPayments from './modules/guests/GuestPayments';
import AdminSignin from './features/admin/Logins/AdminSignin';
import AdminSignup from './features/admin/Logins/AdminSignup';
import GuestSignin from './features/guest/Logins/Signin';
import GuestSignup from './features/guest/Logins/Signup';
import { AuthProvider } from './features/shared/auth/AuthProvider';
import RequireRole from './features/shared/auth/RequireRole.jsx';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';
import { Customers } from './features/admin/pages';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      delay: 200,
      offset: 100,
      easing: 'ease-in-out',
    });
  }, []);
  return (
    <AuthProvider>
      
        <Routes>
          {/* Public auth pages */}
          <Route path="/admin/signin" element={<AdminSignin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/guest/signin" element={<GuestSignin />} />
          <Route path="/guest/signup" element={<GuestSignup />} />

          {/* Admin area - ADMIN only */}
          <Route element={<RequireRole role="ADMIN" redirectTo="/admin/signin" />}> 
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<RoomManagement />} /> {/* Make sure this route exists */}
              <Route path="reservations" element={<Reservations />} />
              <Route path="guests" element={<Guests />} />
              <Route path='customers' element={<Customers/>}/>
              <Route path="staff" element={<Staff />} />
              <Route path="billing" element={<Billing />} />
              <Route path="restaurant" element={<Restaurant />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Guest area - GUEST only */}
          <Route element={<RequireRole role="GUEST" redirectTo="/guest/signin" />}> 
            <Route path="/guest" element={<GuestLayout />}>
              <Route index element={<GuestHome />} />
              <Route path="menu" element={<GuestMenu />} />
              <Route path="bookings" element={<GuestBookings />} />
              <Route path="requests" element={<GuestRequests />} />
              <Route path="payments" element={<GuestPayments />} />
            </Route>
          </Route>
        </Routes>
        
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
 
    </AuthProvider>
  );
}

export default App;