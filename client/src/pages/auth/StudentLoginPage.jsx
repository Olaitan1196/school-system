import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentLoginPage = () => {
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
            if (user.role !== 'student') {
                toast.error('Access denied. Students only.');
                return;
            }
            login(user, token);
            toast.success(`Welcome, ${user.first_name || 'Student'}!`);
            navigate('/student');
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-fuchsia-950 via-fuchsia-900 to-fuchsia-800 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-700/20 rounded-full blur-3xl"></div>
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
                        <p className="text-fuchsia-300 text-xs">Excellence in Education</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="text-6xl mb-6">🎓</div>
                    <h2 className="text-4xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Student Portal
                    </h2>
                    <p className="text-fuchsia-200 text-lg leading-relaxed mb-8">
                        Your academic hub. View your results,
                        check attendance, access the library
                        and manage your school fees.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            'View Results',
                            'Attendance Records',
                            'Library Access',
                            'Fee Payments',
                            'CBT Practice',
                            'School Calendar',
                        ].map((feature) => (
                            <div key={feature}
                                className="flex items-center gap-2 text-fuchsia-200 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-300"></div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-fuchsia-400 text-sm">
                        © {new Date().getFullYear()} Comforters' College
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f7ff] px-4 sm:px-8 py-12">
                <div className="w-full max-w-md">

                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-900 flex items-center justify-center">
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
                        <span className="inline-block bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            Student Access
                        </span>
                        <h1 className="text-3xl font-bold text-purple-950 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Welcome Back
                        </h1>
                        <p className="text-purple-400 text-sm">
                            Sign in with your admission number or phone
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="form-label">
                                Admission Number or Phone
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="CC/2024/001 or 08012345678"
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
                            className="w-full py-3 text-base font-semibold bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In to Student Portal'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-purple-100">
                        <p className="text-center text-purple-400 text-sm mb-4">
                            Not a student?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/login/admin"
                                className="text-center py-2.5 px-4 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
                                Admin Login
                            </Link>
                            <Link to="/login/teacher"
                                className="text-center py-2.5 px-4 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
                                Teacher Login
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

export default StudentLoginPage;