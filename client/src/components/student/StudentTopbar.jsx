import { useAuth } from '../../context/AuthContext';

const StudentTopbar = ({ onMenuClick }) => {
    const { user } = useAuth();

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
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                    <div className="w-5 h-0.5 bg-fuchsia-700 mb-1"></div>
                    <div className="w-5 h-0.5 bg-fuchsia-700 mb-1"></div>
                    <div className="w-5 h-0.5 bg-fuchsia-700"></div>
                </button>
                <div>
                    <h1 className="text-base font-semibold text-purple-900">
                        {getGreeting()}, {user?.first_name || 'Student'} 👋
                    </h1>
                    <p className="text-purple-400 text-xs">{today}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-lg border border-purple-100 bg-fuchsia-50">
                <div className="w-7 h-7 rounded-full bg-fuchsia-700 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                        {user?.first_name?.[0] || 'S'}
                    </span>
                </div>
                <span className="text-fuchsia-800 text-sm font-medium hidden sm:block">
                    {user?.admission_number || 'Student'}
                </span>
            </div>
        </header>
    );
};

export default StudentTopbar;