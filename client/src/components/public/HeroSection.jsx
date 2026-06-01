import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
                {/* DECORATIVE CIRCLES */}
                <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-lilac-500/10 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-800/30 blur-3xl"></div>

                {/* GRID PATTERN */}
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}>
                </div>
            </div>

            {/* CONTENT */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT SIDE */}
                    <div className="text-white">
                        <div className="inline-flex items-center gap-2 bg-purple-700/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-purple-200 text-sm font-medium">
                                Academic Session 2024/2025 is Active
                            </span>
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Welcome to{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                                Comforters'
                            </span>
                            {' '}College
                        </h1>

                        <p className="text-purple-200 text-lg leading-relaxed mb-10 max-w-lg"
                           style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            A fully automated school management platform
                            built for excellence. Empowering students,
                            teachers, and administrators with modern tools
                            for outstanding academic performance.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/result')}
                                className="px-8 py-3.5 bg-white text-purple-900 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Check Result
                            </button>
                            <button
                                onClick={() => navigate('/practice-exams')}
                                className="px-8 py-3.5 bg-purple-600/50 backdrop-blur-sm border border-purple-400/30 text-white font-semibold rounded-xl hover:bg-purple-600/70 transition-all"
                            >
                                Practice Exams
                            </button>
                        </div>

                        {/* EXAM BODIES */}
                        <div className="mt-12 flex flex-wrap gap-3">
                            {['WAEC', 'UTME', 'NECO', 'BECE'].map((exam) => (
                                <span key={exam}
                                    className="px-4 py-2 bg-purple-800/50 border border-purple-600/30 rounded-lg text-purple-200 text-sm font-medium">
                                    {exam} Mock
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE - PORTAL CARDS */}
                    <div className="hidden lg:grid grid-cols-2 gap-4">
                        {[
                            {
                                title: 'Admin Portal',
                                desc: 'Full school management',
                                icon: '🏫',
                                color: 'from-purple-600 to-purple-800',
                                path: '/login/admin'
                            },
                            {
                                title: 'Teacher Portal',
                                desc: 'Scores & attendance',
                                icon: '👩‍🏫',
                                color: 'from-violet-600 to-violet-800',
                                path: '/login/teacher'
                            },
                            {
                                title: 'Student Portal',
                                desc: 'Results & library',
                                icon: '🎓',
                                color: 'from-fuchsia-600 to-fuchsia-800',
                                path: '/login/student'
                            },
                            {
                                title: 'CBT Portal',
                                desc: 'Practice exams',
                                icon: '💻',
                                color: 'from-pink-600 to-pink-800',
                                path: '/practice-exams'
                            },
                        ].map((portal) => (
                            <button
                                key={portal.title}
                                onClick={() => navigate(portal.path)}
                                className={`bg-gradient-to-br ${portal.color} p-6 rounded-2xl text-left hover:scale-105 transition-all duration-200 shadow-lg border border-white/10`}
                            >
                                <div className="text-3xl mb-3">{portal.icon}</div>
                                <h3 className="text-white font-bold text-base mb-1"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {portal.title}
                                </h3>
                                <p className="text-purple-200 text-sm">{portal.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM WAVE */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 80L1440 80L1440 40C1440 40 1080 0 720 0C360 0 0 40 0 40L0 80Z"
                        fill="#f8f7ff"/>
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;