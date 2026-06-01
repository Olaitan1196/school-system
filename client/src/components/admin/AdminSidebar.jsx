import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

const menuItems = [
    {
        group: 'Main',
        items: [
            { label: 'Dashboard', icon: '📊', path: '/admin' },
        ]
    },
    {
        group: 'People',
        items: [
            { label: 'Students', icon: '🎓', path: '/admin/students' },
            { label: 'Teachers', icon: '👩‍🏫', path: '/admin/teachers' },
        ]
    },
    {
        group: 'Academics',
        items: [
            { label: 'Classes & Subjects', icon: '📚', path: '/admin/classes' },
            { label: 'Scores & Results', icon: '📝', path: '/admin/scores' },
            { label: 'Attendance', icon: '📅', path: '/admin/attendance' },
            { label: 'Promotions', icon: '🏆', path: '/admin/promotions' },
        ]
    },
    {
        group: 'Finance',
        items: [
            { label: 'Fees & Invoicing', icon: '💰', path: '/admin/fees' },
            { label: 'Payments', icon: '💳', path: '/admin/payments' },
        ]
    },
    {
        group: 'Exams',
        items: [
            { label: 'CBT Management', icon: '💻', path: '/admin/cbt' },
            { label: 'Exam Access', icon: '🔐', path: '/admin/exam-access' },
        ]
    },
    {
        group: 'Resources',
        items: [
            { label: 'Library', icon: '📖', path: '/admin/library' },
            { label: 'Calendar', icon: '🗓️', path: '/admin/calendar' },
        ]
    },
    {
        group: 'System',
        items: [
            { label: 'Settings', icon: '⚙️', path: '/admin/settings' },
            { label: 'Audit Logs', icon: '🔍', path: '/admin/audit' },
        ]
    },
];

const AdminSidebar = ({ isOpen, onClose }) => {
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
            navigate('/login/admin');
        }
    };

    return (
        <aside className={`
            fixed top-0 left-0 h-full w-64 z-30
            bg-gradient-to-b from-purple-950 to-purple-900
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
        `}>
            {/* LOGO */}
            <div className="p-6 border-b border-purple-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm leading-tight truncate"
                           style={{ fontFamily: "'Playfair Display', serif" }}>
                            Comforters' College
                        </p>
                        <p className="text-purple-300 text-xs">Admin Portal</p>
                    </div>
                </div>
            </div>

            {/* MENU */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map((group) => (
                    <div key={group.group} className="mb-4">
                        <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                            {group.group}
                        </p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/admin'}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-0.5 ${
                                        isActive
                                            ? 'bg-purple-700 text-white shadow-sm'
                                            : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
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
            <div className="p-4 border-t border-purple-800/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                            {user?.first_name?.[0] || 'A'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                            {user?.first_name
                                ? `${user.first_name} ${user.last_name}`
                                : 'Administrator'
                            }
                        </p>
                        <p className="text-purple-400 text-xs truncate">
                            {user?.email || 'Admin'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-purple-300 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
                >
                    <span>🚪</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;