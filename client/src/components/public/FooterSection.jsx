import { Link } from 'react-router-dom';

const FooterSection = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#f8f7ff] border-t border-purple-100 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

                    {/* BRAND */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center">
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
                        <p className="text-purple-400 text-sm leading-relaxed max-w-sm">
                            A fully automated, offline-ready school management
                            platform designed for Nigerian secondary schools.
                            Empowering excellence through technology.
                        </p>
                    </div>

                    {/* QUICK LINKS */}
                    <div>
                        <h4 className="text-purple-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            {[
                                { label: 'Check Result', href: '/result' },
                                { label: 'Practice Exams', href: '/practice-exams' },
                                { label: 'Request Access', href: '/exam-access' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link to={link.href}
                                        className="text-purple-400 hover:text-purple-700 text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* PORTALS */}
                    <div>
                        <h4 className="text-purple-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                            Portals
                        </h4>
                        <ul className="space-y-2">
                            {[
                                { label: 'Admin Portal', href: '/login/admin' },
                                { label: 'Teacher Portal', href: '/login/teacher' },
                                { label: 'Student Portal', href: '/login/student' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link to={link.href}
                                        className="text-purple-400 hover:text-purple-700 text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* BOTTOM */}
                <div className="border-t border-purple-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-purple-400 text-sm">
                        © {year} Comforters' College. All rights reserved.
                    </p>
                    <p className="text-purple-300 text-sm">
                        Powered by Comforters' College School Management System
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;