import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import OnlineBadge from './OnlineBadge';

const AdminTopbar = ({ onMenuClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const today = new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="bg-white border-b border-purple-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                    <div className="w-5 h-0.5 bg-purple-700 mb-1"></div>
                    <div className="w-5 h-0.5 bg-purple-700 mb-1"></div>
                    <div className="w-5 h-0.5 bg-purple-700"></div>
                </button>

                <div>
                    <h1 className="text-base font-semibold text-purple-900">
                        {getGreeting()}, {user?.first_name || 'Admin'} 👋
                    </h1>
                    <p className="text-purple-400 text-xs">{today}</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">

                {/* ONLINE/OFFLINE BADGE */}
                <OnlineBadge />

                {/* NOTIFICATIONS */}
                <NotificationDropdown />

                {/* PROFILE */}
                <button
                    onClick={() => navigate('/admin/settings')}
                    className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-lg hover:bg-purple-50 transition-colors border border-purple-100"
                >
                    <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                            {user?.first_name?.[0] || 'A'}
                        </span>
                    </div>
                    <span className="text-purple-800 text-sm font-medium hidden sm:block">
                        {user?.first_name || 'Admin'}
                    </span>
                </button>
            </div>
        </header>
    );
};

export default AdminTopbar;