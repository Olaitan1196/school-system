import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // FETCH MY PROFILE
    const { data: profileData } = useQuery({
        queryKey: ['student-profile'],
        queryFn: async () => {
            const res = await api.get('/auth/me');
            return res.data;
        }
    });

    // FETCH MY INVOICE
    const { data: invoiceData } = useQuery({
        queryKey: ['student-dashboard-invoice'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // FETCH UPCOMING EVENTS
    const { data: eventsData } = useQuery({
        queryKey: ['student-upcoming-events'],
        queryFn: async () => {
            const res = await api.get('/calendar/upcoming?limit=3');
            return res.data;
        }
    });

    const profile = profileData?.data;
    const upcoming = eventsData?.data ?? [];

    const eventTypeIcons = {
        resumption: '🏫',
        closing: '🔒',
        holiday: '🎉',
        examination: '📝',
        cbt: '💻',
        sports: '⚽',
        cultural: '🎭',
        result_day: '📊',
        other: '📌',
    };

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Welcome to your student portal
                </p>
            </div>

            {/* PROFILE CARD */}
            <div className="card bg-gradient-to-r from-fuchsia-900 to-fuchsia-800 border-0">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        {profile?.passport_url ? (
                            <img
                                src={profile.passport_url}
                                alt={profile.first_name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-2xl font-bold">
                                {profile?.first_name?.[0] || 'S'}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            {profile?.first_name} {profile?.last_name}
                        </h2>
                        <p className="text-fuchsia-200 text-sm">
                            {profile?.admission_number}
                        </p>
                        <div className="flex gap-3 mt-2 text-fuchsia-200 text-xs">
                            {profile?.class_name && (
                                <span>📚 {profile.class_name}</span>
                            )}
                            {profile?.stream_name && (
                                <span>🔬 {profile.stream_name}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTION CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: '📝',
                        label: 'My Results',
                        desc: 'View term results',
                        color: 'bg-purple-50',
                        path: '/student/results'
                    },
                    {
                        icon: '📅',
                        label: 'Attendance',
                        desc: 'View my attendance',
                        color: 'bg-blue-50',
                        path: '/student/attendance'
                    },
                    {
                        icon: '💰',
                        label: 'My Invoice',
                        desc: 'Check payments',
                        color: 'bg-yellow-50',
                        path: '/student/invoice'
                    },
                    {
                        icon: '📚',
                        label: 'Library',
                        desc: 'Browse books',
                        color: 'bg-green-50',
                        path: '/student/library'
                    },
                ].map((card) => (
                    <button
                        key={card.label}
                        onClick={() => navigate(card.path)}
                        className="bg-white rounded-2xl p-5 border border-purple-100 hover:border-fuchsia-300 hover:shadow-md transition-all text-left"
                    >
                        <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-xl mb-3`}>
                            {card.icon}
                        </div>
                        <p className="font-semibold text-purple-900 text-sm">{card.label}</p>
                        <p className="text-purple-400 text-xs mt-0.5">{card.desc}</p>
                    </button>
                ))}
            </div>

            {/* UPCOMING EVENTS */}
            {upcoming.length > 0 && (
                <div className="card">
                    <h2 className="section-title mb-4">Upcoming Events</h2>
                    <div className="space-y-3">
                        {upcoming.map((event) => (
                            <div key={event.id}
                                className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                <div className="text-center bg-white rounded-lg p-2 min-w-12 border border-purple-100">
                                    <p className="text-purple-900 text-xs font-bold">
                                        {new Date(event.event_date).toLocaleDateString('en-NG', { day: '2-digit' })}
                                    </p>
                                    <p className="text-purple-400 text-xs">
                                        {new Date(event.event_date).toLocaleDateString('en-NG', { month: 'short' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-purple-900 text-sm font-medium">
                                        {event.event_title}
                                    </p>
                                    <p className="text-purple-400 text-xs capitalize">
                                        {eventTypeIcons[event.event_type]} {event.event_type.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;