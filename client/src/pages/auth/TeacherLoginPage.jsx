import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherLoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.error('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                identifier,
                password
            });
            const { token, user } = response.data;
            if (
                user.role !== 'class_teacher' &&
                user.role !== 'subject_teacher'
            ) {
                toast.error('Access denied. Teachers only.');
                return;
            }
            login(user, token);
            toast.success(`Welcome, ${user.first_name || 'Teacher'}!`);
            navigate('/teacher');
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Login failed.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <div>
                        <p className="font-bold text-white"
                           style={{ fontFamily: "'Playfair Display', serif" }}>
                            Comforters' College
                        </p>
                        <p className="text-violet-300 text-xs">Excellence in Education</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="text-6xl mb-6">👩‍🏫</div>
                    <h2 className="text-4xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Teacher Portal
                    </h2>
                    <p className="text-violet-200 text-lg leading-relaxed mb-8">
                        Your classroom management hub.
                        Enter scores, mark attendance,
                        create CBT questions and track
                        student progress.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            'Score Entry',
                            'Attendance Marking',
                            'CBT Questions',
                            'Student Progress',
                            'Class Management',
                            'Result Analytics',
                        ].map((feature) => (
                            <div key={feature}
                                className="flex items-center gap-2 text-violet-200 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-300"></div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-violet-400 text-sm">
                        © {new Date().getFullYear()} Comforters' College
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f7ff] px-4 sm:px-8 py-12">
                <div className="w-full max-w-md">

                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <div>
                            <p className="font-bold text-purple-900"
                               style={{ fontFamily: "'Playfair Display', serif" }}>
                                Comforters' College
                            </p>
                            <p className="text-purple-400 text-xs">Excellence in Education</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <span className="inline-block bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            Teacher Access
                        </span>
                        <h1 className="text-3xl font-bold text-purple-950 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Welcome Back
                        </h1>
                        <p className="text-purple-400 text-sm">
                            Sign in to your teacher dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="form-label">
                                Email or Phone Number
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="teacher@comforterscollege.com"
                                className="input-field"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="input-field pr-12"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In to Teacher Portal'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-purple-100">
                        <p className="text-center text-purple-400 text-sm mb-4">
                            Not a teacher?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/login/admin"
                                className="text-center py-2.5 px-4 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
                                Admin Login
                            </Link>
                            <Link to="/login/student"
                                className="text-center py-2.5 px-4 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
                                Student Login
                            </Link>
                        </div>
                        <div className="text-center mt-4">
                            <Link to="/"
                                className="text-purple-400 hover:text-purple-600 text-sm transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherLoginPage;