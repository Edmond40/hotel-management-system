import { useEffect, useState } from 'react';
import ChartCard from '../../components/charts/ChartCard.jsx';
import SimpleArea from '../../components/charts/SimpleArea.jsx';
import SimpleBar from '../../components/charts/SimpleBar.jsx';
import SimpleDonut from '../../components/charts/SimpleDonut.jsx';
import Counter from '../../components/common/Counter.jsx';
import { useAuth } from '../../features/shared/auth/AuthProvider.jsx';
import http from '../../features/shared/services/http.js';

function GuestHome() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        try {
            const data = await http.get('/guest/dashboard');
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="text-center text-slate-600">
                <p>Unable to load dashboard data</p>
            </div>
        );
    }

    return (
        <section className="space-y-6" data-aos="fade-up">
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Welcome back {user?.name || 'Guest'}</h1>
                <p className="text-sm sm:text-base text-slate-600">View your bookings, request meals, and manage your stay.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ChartCard 
                    title="Upcoming Stay" 
                    value={
                        dashboardData.upcomingStay ? (
                            <><Counter value={dashboardData.upcomingStay.nights} /> nights</>
                        ) : (
                            <span className="text-slate-500">No upcoming stay</span>
                        )
                    } 
                    subtitle={
                        dashboardData.upcomingStay 
                            ? `${dashboardData.upcomingStay.checkInDate} - ${dashboardData.upcomingStay.checkOutDate}`
                            : "Book your next stay"
                    }
                >
                    <SimpleArea data={[1,2,3,2,4,3,5,4]} color="#16a34a" />
                </ChartCard>

                <ChartCard 
                    title="Meal Requests" 
                    value={<><Counter value={dashboardData.mealRequests || 0} /> this week</>} 
                    subtitle="Food & beverage orders"
                >
                    <SimpleBar data={[2,4,3,5,4,6,5]} color="#0ea5e9" />
                </ChartCard>

                <ChartCard 
                    title="Total Spent" 
                    value={<>$<Counter value={dashboardData.totalSpent || 0} /></>} 
                    subtitle="This month"
                >
                    <SimpleDonut data={[72, 28]} colors={["#16a34a", "#e2e8f0"]} />
                </ChartCard>
            </div>

            {dashboardData.upcomingStay && dashboardData.upcomingStay.nights > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h3 className="font-medium text-emerald-800 mb-2">Your Next Stay</h3>
                    <p className="text-emerald-700">
                        Room {dashboardData.upcomingStay.room?.number || 'N/A'} • {dashboardData.upcomingStay.nights} nights
                    </p>
                </div>
            )}
        </section>
    );
}

export default GuestHome;
