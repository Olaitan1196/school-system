import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon, label, value, sub, color, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left w-full"
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
                {icon}
            </div>
        </div>
        <div className="text-3xl font-bold text-purple-950 mb-1"
             style={{ fontFamily: "'Playfair Display', serif" }}>
            {value ?? '...'}
        </div>
        <div className="text-purple-600 font-medium text-sm">{label}</div>
        {sub && <div className="text-purple-400 text-xs mt-1">{sub}</div>}
    </button>
);


// ============================================
// QUICK ACTION COMPONENT
// ============================================
const QuickAction = ({ icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${color}`}
    >
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
);


// ============================================
// MAIN DASHBOARD
// ============================================
const AdminDashboard = () => {
    const navigate = useNavigate();

    // Fetch students count
    const { data: studentsData } = useQuery({
        queryKey: ['students-count'],
        queryFn: async () => {
            const res = await api.get('/students?limit=1');
            return res.data;
        }
    });

    // Fetch teachers count
    const { data: teachersData } = useQuery({
        queryKey: ['teachers-count'],
        queryFn: async () => {
            const res = await api.get('/teachers?limit=1');
            return res.data;
        }
    });

    // Fetch pending payments
    const { data: paymentsData } = useQuery({
        queryKey: ['pending-payments'],
        queryFn: async () => {
            const res = await api.get('/fees/payments?payment_status=pending&limit=5');
            return res.data;
        }
    });

    // Fetch upcoming events
    const { data: eventsData } = useQuery({
        queryKey: ['upcoming-events'],
        queryFn: async () => {
            const res = await api.get('/calendar/upcoming?limit=5');
            return res.data;
        }
    });

    // Fetch exam access requests
    const { data: accessRequestsData } = useQuery({
        queryKey: ['access-requests'],
        queryFn: async () => {
            const res = await api.get('/exam-access/requests?request_status=pending&limit=1');
            return res.data;
        }
    });

    const totalStudents = studentsData?.pagination?.total ?? 0;
    const totalTeachers = teachersData?.pagination?.total ?? 0;
    const pendingPayments = paymentsData?.pagination?.total ?? 0;
    const pendingRequests = accessRequestsData?.pagination?.total ?? 0;
    const upcomingEvents = eventsData?.data ?? [];
    const recentPayments = paymentsData?.data ?? [];

    const getEventTypeColor = (type) => {
        const colors = {
            resumption: 'bg-green-100 text-green-700',
            closing: 'bg-red-100 text-red-700',
            holiday: 'bg-yellow-100 text-yellow-700',
            examination: 'bg-blue-100 text-blue-700',
            cbt: 'bg-purple-100 text-purple-700',
            sports: 'bg-orange-100 text-orange-700',
            result_day: 'bg-pink-100 text-pink-700',
            other: 'bg-gray-100 text-gray-700',
        };
        return colors[type] || colors.other;
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return colors[status] || colors.pending;
    };

    return (
        <div className="space-y-8">

            {/* PAGE HEADER */}
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Overview of Comforters' College
                </p>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon="🎓"
                    label="Total Students"
                    value={totalStudents}
                    sub="Active enrollments"
                    color="bg-purple-50"
                    onClick={() => navigate('/admin/students')}
                />
                <StatCard
                    icon="👩‍🏫"
                    label="Total Teachers"
                    value={totalTeachers}
                    sub="Active staff"
                    color="bg-violet-50"
                    onClick={() => navigate('/admin/teachers')}
                />
                <StatCard
                    icon="💳"
                    label="Pending Payments"
                    value={pendingPayments}
                    sub="Awaiting approval"
                    color="bg-yellow-50"
                    onClick={() => navigate('/admin/payments')}
                />
                <StatCard
                    icon="🔐"
                    label="Access Requests"
                    value={pendingRequests}
                    sub="Exam portal requests"
                    color="bg-fuchsia-50"
                    onClick={() => navigate('/admin/exam-access')}
                />
            </div>

            {/* QUICK ACTIONS */}
            <div className="card">
                <h2 className="section-title mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        {
                            icon: '➕',
                            label: 'Add Student',
                            path: '/admin/students',
                            color: 'border-purple-200 hover:bg-purple-50 text-purple-700'
                        },
                        {
                            icon: '👩‍🏫',
                            label: 'Add Teacher',
                            path: '/admin/teachers',
                            color: 'border-violet-200 hover:bg-violet-50 text-violet-700'
                        },
                        {
                            icon: '📝',
                            label: 'Enter Scores',
                            path: '/admin/scores',
                            color: 'border-blue-200 hover:bg-blue-50 text-blue-700'
                        },
                        {
                            icon: '📅',
                            label: 'Attendance',
                            path: '/admin/attendance',
                            color: 'border-green-200 hover:bg-green-50 text-green-700'
                        },
                        {
                            icon: '💰',
                            label: 'Invoices',
                            path: '/admin/fees',
                            color: 'border-yellow-200 hover:bg-yellow-50 text-yellow-700'
                        },
                        {
                            icon: '💳',
                            label: 'Payments',
                            path: '/admin/payments',
                            color: 'border-orange-200 hover:bg-orange-50 text-orange-700'
                        },
                        {
                            icon: '💻',
                            label: 'CBT Exams',
                            path: '/admin/cbt',
                            color: 'border-pink-200 hover:bg-pink-50 text-pink-700'
                        },
                        {
                            icon: '📊',
                            label: 'Results',
                            path: '/admin/scores',
                            color: 'border-fuchsia-200 hover:bg-fuchsia-50 text-fuchsia-700'
                        },
                    ].map((action) => (
                        <QuickAction
                            key={action.label}
                            icon={action.icon}
                            label={action.label}
                            color={action.color}
                            onClick={() => navigate(action.path)}
                        />
                    ))}
                </div>
            </div>

            {/* BOTTOM GRID */}
            <div className="grid lg:grid-cols-2 gap-6">

                {/* RECENT PAYMENTS */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">Pending Payments</h2>
                        <button
                            onClick={() => navigate('/admin/payments')}
                            className="text-purple-500 hover:text-purple-700 text-sm font-medium transition-colors"
                        >
                            View all →
                        </button>
                    </div>

                    {recentPayments.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="text-purple-400 text-sm">
                                No pending payments
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentPayments.map((payment) => (
                                <div key={payment.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                                    <div>
                                        <p className="text-purple-900 text-sm font-medium">
                                            {payment.first_name} {payment.last_name}
                                        </p>
                                        <p className="text-purple-400 text-xs">
                                            {payment.payment_reference}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-purple-900 text-sm font-bold">
                                            ₦{parseFloat(payment.amount_paid).toLocaleString()}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(payment.payment_status)}`}>
                                            {payment.payment_status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* UPCOMING EVENTS */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">Upcoming Events</h2>
                        <button
                            onClick={() => navigate('/admin/calendar')}
                            className="text-purple-500 hover:text-purple-700 text-sm font-medium transition-colors"
                        >
                            View all →
                        </button>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">📅</div>
                            <p className="text-purple-400 text-sm">
                                No upcoming events
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map((event) => (
                                <div key={event.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                                    <div className="text-center bg-white rounded-lg p-2 min-w-12 border border-purple-100">
                                        <p className="text-purple-900 text-xs font-bold">
                                            {new Date(event.event_date).toLocaleDateString('en-NG', { day: '2-digit' })}
                                        </p>
                                        <p className="text-purple-400 text-xs">
                                            {new Date(event.event_date).toLocaleDateString('en-NG', { month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-purple-900 text-sm font-medium truncate">
                                            {event.event_title}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEventTypeColor(event.event_type)}`}>
                                            {event.event_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SYSTEM INFO */}
            <div className="card bg-gradient-to-r from-purple-900 to-purple-800 border-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Comforters' College School System
                        </h3>
                        <p className="text-purple-300 text-sm">
                            Version 1.0.0 · Academic Session 2024/2025
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-green-300 text-sm font-medium">
                            System Online
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;