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
    pendingInvoices: 0,
    totalInvoices: 0,
    totalPendingAmount: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    mealRequest: 0,
    totalRooms: 6
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
      value: stats.occupancy, 
      suffix: '%', 
      icon: <Activity size={20} className='text-blue-500'/>,
      color: 'text-blue-500'
    },
    { 
      label: 'Active Reservations', 
      value: stats.activeReservations, 
      icon: <CalendarCheck size={20} className='text-orange-500'/>,
      color: 'text-orange-500'
    },
    { 
      label: 'Available Rooms', 
      value: stats.availableRooms, 
      icon: <BedDouble size={20} className='text-green-500'/>,
      color: 'text-green-500'
    },
    { 
      label: 'Pending Invoices', 
      value: stats.pendingInvoices, 
      icon: <Receipt size={20} className='text-yellow-500'/>,
      color: 'text-yellow-500'
    },
    { 
      label: 'Menu Items', 
      value: stats.mealRequest, 
      icon: <Utensils size={20} className='text-purple-500'/>,
      color: 'text-purple-500'
    },
  ];

  // Calculate occupancy percentage
  const occupancyPercentage = stats.availableRooms > 0 ? Math.round(((stats.totalRooms - stats.availableRooms) / stats.totalRooms) * 100) : 0;

  // Generate revenue data based on pending invoices
  const generateRevenueData = () => {
    const baseData = [4, 6, 5, 7, 9, 8, 11, 12, 10, 13, 12, 15];
    const multiplier = stats.totalPendingAmount > 0 ? (stats.totalPendingAmount / 1000) : 1;
    return baseData.map(value => Math.round(value * multiplier));
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
          title="Revenue (Pending)" 
          value={`$${stats.totalPendingAmount.toLocaleString()}`} 
          subtitle={`${stats.pendingInvoices} unpaid invoices`}
        >
          <SimpleArea data={generateRevenueData()} color="#16a34a" />
        </ChartCard>
        <ChartCard 
          title="Reservations Status" 
          value={stats.activeReservations.toString()} 
          subtitle={`${stats.confirmedReservations} confirmed, ${stats.pendingReservations} pending`}
        >
          <SimpleBar data={[stats.confirmedReservations, stats.pendingReservations, stats.availableRooms]} color="#0ea5e9" />
        </ChartCard>
        <ChartCard 
          title="Room Occupancy" 
          value={`${occupancyPercentage}%`} 
          subtitle={`${stats.totalRooms - stats.availableRooms} of ${stats.totalRooms} rooms occupied`}
        >
          <SimpleDonut value={occupancyPercentage / 100} color="#f59e0b" />
        </ChartCard>
      </section>
    </div>
  );
}

export default Dashboard;
