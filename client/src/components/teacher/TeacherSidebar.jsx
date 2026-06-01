import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

const menuItems = [
    {
        group: 'Main',
        items: [
            { label: 'Dashboard', icon: '📊', path: '/teacher' },
        ]
    },
    {
        group: 'My Work',
        items: [
            { label: 'My Classes', icon: '🏫', path: '/teacher/classes' },
            { label: 'Score Entry', icon: '📝', path: '/teacher/scores' },
            { label: 'Attendance', icon: '📅', path: '/teacher/attendance' },
            { label: 'CBT Questions', icon: '❓', path: '/teacher/questions' },
        ]
    },
    {
        group: 'Resources',
        items: [
            { label: 'Library', icon: '📚', path: '/teacher/library' },
            { label: 'Calendar', icon: '🗓️', path: '/teacher/calendar' },
        ]
    },
    {
        group: 'Account',
        items: [
            { label: 'Settings', icon: '⚙️', path: '/teacher/settings' },
        ]
    },
];

const TeacherSidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // silently fail
        } finally {
            logout();
            toast.success('Logged out successfully.');
            navigate('/login/teacher');
        }
    };

    return (
        <aside className={`
            fixed top-0 left-0 h-full w-64 z-30
            bg-gradient-to-b from-violet-950 to-violet-900
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
        `}>
            {/* LOGO */}
            <div className="p-6 border-b border-violet-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm leading-tight truncate"
                           style={{ fontFamily: "'Playfair Display', serif" }}>
                            Comforters' College
                        </p>
                        <p className="text-violet-300 text-xs">Teacher Portal</p>
                    </div>
                </div>
            </div>

            {/* MENU */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map((group) => (
                    <div key={group.group} className="mb-4">
                        <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                            {group.group}
                        </p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/teacher'}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-0.5 ${
                                        isActive
                                            ? 'bg-violet-700 text-white shadow-sm'
                                            : 'text-violet-200 hover:bg-violet-800/50 hover:text-white'
                                    }`
                                }
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* USER PROFILE */}
            <div className="p-4 border-t border-violet-800/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                            {user?.first_name?.[0] || 'T'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                            {user?.first_name
                                ? `${user.first_name} ${user.last_name}`
                                : 'Teacher'
                            }
                        </p>
                        <p className="text-violet-400 text-xs truncate capitalize">
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-violet-300 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
                >
                    <span>🚪</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default TeacherSidebar;