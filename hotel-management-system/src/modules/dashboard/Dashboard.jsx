import { useEffect, useState } from 'react';
import { Activity, CalendarCheck, BedDouble, Receipt, Utensils } from 'lucide-react';
import ChartCard from '../../components/charts/ChartCard.jsx';
import SimpleArea from '../../components/charts/SimpleArea.jsx';
import SimpleBar from '../../components/charts/SimpleBar.jsx';
import SimpleDonut from '../../components/charts/SimpleDonut.jsx';
import Counter from '../../components/common/Counter.jsx';
import http from '../../features/shared/services/http.js';

function Dashboard() {
  const [stats, setStats] = useState({
    occupancy: 0,
    activeReservations: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    cleaningRooms: 0,
    pendingInvoices: 0,
    totalInvoices: 0,
    totalPendingAmount: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    mealRequest: 0,
    totalRooms: 0,
    rooms: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardStats() {
    try {
      const data = await http.get('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { 
      label: 'Occupancy', 
      value: stats.occupancy || 0, 
      suffix: '%', 
      icon: <Activity size={20} className='text-blue-500'/>,
      color: 'text-blue-500',
      tooltip: `${stats.occupiedRooms || 0} of ${stats.totalRooms || 0} rooms occupied`
    },
    { 
      label: 'Active Reservations', 
      value: stats.activeReservations?.length || 0, 
      icon: <CalendarCheck size={20} className='text-orange-500'/>,
      color: 'text-orange-500',
      tooltip: `${stats.confirmedReservations || 0} confirmed, ${stats.pendingReservations || 0} pending`
    },
    { 
      label: 'Available Rooms', 
      value: stats.availableRooms || 0, 
      icon: <BedDouble size={20} className='text-green-500'/>,
      color: 'text-green-500',
      tooltip: `Out of ${stats.totalRooms || 0} total rooms`
    },
    { 
      label: 'Pending Invoices', 
      value: stats.pendingInvoices || 0, 
      icon: <Receipt size={20} className='text-yellow-500'/>,
      color: 'text-yellow-500',
      tooltip: `Total pending: ₵${(stats.totalPendingAmount || 0).toLocaleString()}`
    },
    { 
      label: 'Menu Items', 
      value: stats.mealRequest || 0, 
      icon: <Utensils size={20} className='text-purple-500'/>,
      color: 'text-purple-500',
      tooltip: 'Total menu items available'
    },
  ];

  // Calculate occupancy percentage
  const occupancyPercentage = stats.totalRooms > 0 ? 
    Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0;

  // Generate revenue data for the chart
  const generateRevenueData = () => {
    // If we have room data with reservations, use that
    if (stats.rooms && stats.rooms.length > 0) {
      const monthlyRevenue = Array(12).fill(0);
      
      stats.rooms.forEach(room => {
        if (room.reservations && room.reservations.length > 0) {
          room.reservations.forEach(reservation => {
            if (reservation.checkIn) {
              const month = new Date(reservation.checkIn).getMonth();
              // Use room price for the revenue calculation
              monthlyRevenue[month] += room.price || 0;
            }
          });
        }
      });
      
      // Return last 6 months of data
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push(monthlyRevenue[monthIndex] || 0);
      }
      return last6Months;
    }
    
    // Fallback: Generate some sample data if no room data is available
    return Array(6).fill(0).map(() => Math.floor(Math.random() * 5000) + 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      <section className="dashboard-hero text-white">
        <h1 className='text-xl font-bold'>Welcome to Hotel Admin</h1>
        <p className='text-lg'>Manage reservations, rooms, guests, staff and billing at a glance.</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 p-2 mt-4" data-aos="fade-right">
        {statCards.map((s) => (
          <div className="bg-white p-3 sm:p-4 rounded-md shadow-md flex flex-col justify-between duration-200 hover:-translate-y-1 hover:shadow-lg min-h-[100px]" key={s.label}>
            <div className="flex items-center gap-2 text-sm sm:text-base">{s.icon} <span className="truncate">{s.label}</span></div>
            <div className="font-semibold text-gray-800 text-lg sm:text-xl">
              <Counter value={s.value} suffix={s.suffix} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 sm:p-4" data-aos="fade-up">
        <ChartCard 
          title="Monthly Revenue" 
          value={`₵${(stats.totalPendingAmount || 0).toLocaleString()}`} 
          subtitle="Last 6 months revenue trend"
        >
          <SimpleArea 
            data={generateRevenueData()} 
            color="#16a34a" 
            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          />
        </ChartCard>
        
        <ChartCard 
          title="Reservations" 
          value={stats.activeReservations?.length || 0} 
          subtitle={`${stats.confirmedReservations || 0} confirmed, ${stats.pendingReservations || 0} pending`}
        >
          <SimpleBar 
            data={[
              { name: 'Confirmed', value: stats.confirmedReservations || 0, color: '#10b981' },
              { name: 'Pending', value: stats.pendingReservations || 0, color: '#f59e0b' },
              { name: 'Checked In', value: (stats.checkedInReservations || 0), color: '#3b82f6' }
            ]} 
          />
        </ChartCard>
        
        <ChartCard 
          title="Room Status" 
          value={`${occupancyPercentage}%`} 
          subtitle={`${stats.occupiedRooms || 0} Occupied • ${stats.availableRooms || 0} Available`}
        >
          <SimpleDonut 
            data={[
              { name: 'Occupied', value: stats.occupiedRooms || 0, color: '#f59e0b' },
              { name: 'Available', value: stats.availableRooms || 0, color: '#10b981' },
              { name: 'Maintenance', value: stats.maintenanceRooms || 0, color: '#ef4444' },
              { name: 'Cleaning', value: stats.cleaningRooms || 0, color: '#3b82f6' }
            ]} 
          />
        </ChartCard>
      </section>
    </div>
  );
}

export default Dashboard;
