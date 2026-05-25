import { useNavigate } from 'react-router-dom';

const portals = [
    {
        title: 'Admin Portal',
        desc: 'Complete school management. Manage students, teachers, fees, results, CBT exams and everything in between.',
        icon: '🏫',
        features: ['Student & Teacher Management', 'Fee & Invoice Control', 'Result Publishing', 'CBT Administration'],
        buttonText: 'Admin Login',
        path: '/login/admin',
        gradient: 'from-purple-800 to-purple-950',
        border: 'border-purple-700'
    },
    {
        title: 'Teacher Portal',
        desc: 'Enter scores, mark attendance, create CBT questions and monitor your students performance.',
        icon: '👩‍🏫',
        features: ['Score Entry', 'Attendance Marking', 'CBT Questions', 'Student Progress'],
        buttonText: 'Teacher Login',
        path: '/login/teacher',
        gradient: 'from-violet-700 to-violet-900',
        border: 'border-violet-600'
    },
    {
        title: 'Student Portal',
        desc: 'View your results, check attendance, manage library books and stay updated on school activities.',
        icon: '🎓',
        features: ['Result Viewing', 'Attendance Records', 'Library Access', 'Invoice & Payments'],
        buttonText: 'Student Login',
        path: '/login/student',
        gradient: 'from-fuchsia-700 to-fuchsia-900',
        border: 'border-fuchsia-600'
    },
];

const PortalsSection = () => {
    const navigate = useNavigate();

    return (
        <section className="bg-purple-950 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* HEADING */}
                <div className="text-center mb-16">
                    <span className="inline-block bg-purple-800/50 text-purple-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-purple-700/50">
                        Access Portals
                    </span>
                    <h2 className="text-4xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Choose Your Portal
                    </h2>
                    <p className="text-purple-400 max-w-xl mx-auto">
                        Separate portals designed specifically for each role
                        in the Comforter's College community.
                    </p>
                </div>

                {/* PORTALS GRID */}
                <div className="grid md:grid-cols-3 gap-8">
                    {portals.map((portal, index) => (
                        <div key={index}
                            className={`bg-gradient-to-br ${portal.gradient} rounded-2xl p-8 border ${portal.border}/30 hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
                            <div className="text-5xl mb-6">{portal.icon}</div>
                            <h3 className="text-2xl font-bold text-white mb-3"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {portal.title}
                            </h3>
                            <p className="text-purple-200 text-sm leading-relaxed mb-6">
                                {portal.desc}
                            </p>

                            {/* FEATURES LIST */}
                            <ul className="space-y-2 mb-8">
                                {portal.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-purple-200 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-300"></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => navigate(portal.path)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm"
                            >
                                {portal.buttonText} →
                            </button>
                        </div>
                    ))}
                </div>

                {/* PUBLIC EXAM BANNER */}
                <div className="mt-12 bg-gradient-to-r from-purple-800/50 to-violet-800/50 rounded-2xl p-8 border border-purple-700/30 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Public Exam Practice Portal
                    </h3>
                    <p className="text-purple-300 mb-6 max-w-xl mx-auto">
                        Practice WAEC, UTME, NECO and BECE past questions.
                        Students and staff access instantly. Visitors can request access.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['WAEC Mock', 'UTME Simulation', 'NECO Practice', 'BECE Prep'].map((exam) => (
                            <span key={exam}
                                className="px-4 py-2 bg-purple-700/50 border border-purple-600/30 rounded-lg text-purple-200 text-sm font-medium">
                                {exam}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/practice-exams')}
                        className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
                    >
                        Access Practice Exams
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PortalsSection;