import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
                ? 'bg-white shadow-lg py-3'
                : 'bg-transparent py-5'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <div>
                            <p className={`font-bold text-sm leading-tight transition-colors ${
                                isScrolled ? 'text-purple-900' : 'text-white'
                            }`}
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                                Comforter's College
                            </p>
                            <p className={`text-xs transition-colors ${
                                isScrolled ? 'text-purple-400' : 'text-purple-200'
                            }`}>
                                Excellence in Education
                            </p>
                        </div>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden md:flex items-center gap-8">
                        {[
                            { label: 'Home', href: '/' },
                            { label: 'Result Check', href: '/result' },
                            { label: 'Practice Exams', href: '/practice-exams' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`text-sm font-medium transition-colors hover:text-purple-300 ${
                                    isScrolled
                                        ? 'text-purple-800 hover:text-purple-600'
                                        : 'text-white hover:text-purple-200'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* LOGIN BUTTONS */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login/student')}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                                isScrolled
                                    ? 'text-purple-700 hover:bg-purple-50'
                                    : 'text-white hover:bg-white/10'
                            }`}
                        >
                            Student Login
                        </button>
                        <button
                            onClick={() => navigate('/login/admin')}
                            className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md"
                        >
                            Staff Portal
                        </button>
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <button
                        className="md:hidden p-2 rounded-lg"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <div className={`w-6 h-0.5 mb-1.5 transition-all ${
                            isScrolled ? 'bg-purple-900' : 'bg-white'
                        } ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                        <div className={`w-6 h-0.5 mb-1.5 transition-all ${
                            isScrolled ? 'bg-purple-900' : 'bg-white'
                        } ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                        <div className={`w-6 h-0.5 transition-all ${
                            isScrolled ? 'bg-purple-900' : 'bg-white'
                        } ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                    </button>
                </div>

                {/* MOBILE MENU */}
                <div className={`md:hidden transition-all duration-300 overflow-hidden ${
                    isMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
                }`}>
                    <div className={`rounded-xl p-4 flex flex-col gap-2 ${
                        isScrolled ? 'bg-purple-50' : 'bg-purple-900/90 backdrop-blur-md'
                    }`}>
                        {[
                            { label: 'Home', href: '/' },
                            { label: 'Result Check', href: '/result' },
                            { label: 'Practice Exams', href: '/practice-exams' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                                    isScrolled
                                        ? 'text-purple-800 hover:bg-purple-100'
                                        : 'text-white hover:bg-purple-800'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="border-t border-purple-700/30 my-1 pt-2 flex flex-col gap-2">
                            <button
                                onClick={() => { navigate('/login/student'); setIsMenuOpen(false); }}
                                className={`text-sm font-medium px-4 py-2.5 rounded-lg text-left transition-colors ${
                                    isScrolled
                                        ? 'text-purple-800 hover:bg-purple-100'
                                        : 'text-white hover:bg-purple-800'
                                }`}
                            >
                                Student Login
                            </button>
                            <button
                                onClick={() => { navigate('/login/admin'); setIsMenuOpen(false); }}
                                className="text-sm font-medium px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-left transition-colors"
                            >
                                Staff Portal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;