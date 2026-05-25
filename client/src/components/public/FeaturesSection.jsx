const features = [
    {
        icon: '💻',
        title: 'Computer Based Testing',
        desc: 'Full CBT system with local network support. Students take exams on any connected device without internet.'
    },
    {
        icon: '📊',
        title: 'Automated Report Cards',
        desc: 'Smart grading engine automatically calculates scores, grades, class positions and generates printable report cards.'
    },
    {
        icon: '📅',
        title: 'Attendance Automation',
        desc: 'Daily attendance marking with automated summaries. Track present, absent, late and excused per student per term.'
    },
    {
        icon: '💰',
        title: 'Fees & Invoicing',
        desc: 'Complete invoicing system. Students can pay in full or installments. Admin reviews and approves all payments.'
    },
    {
        icon: '📚',
        title: 'eLibrary Platform',
        desc: 'Digital and physical book management. Students can borrow books or read ebooks directly from the portal.'
    },
    {
        icon: '🔒',
        title: 'Result Access Control',
        desc: 'Results are only accessible after full payment is confirmed. Secure token system protects every result.'
    },
    {
        icon: '📈',
        title: 'Performance Analytics',
        desc: 'Comprehensive dashboards for admin, teachers and students showing academic trends and performance data.'
    },
    {
        icon: '🌐',
        title: 'Offline Ready',
        desc: 'Works without internet. All data syncs automatically to the cloud when connection is restored.'
    },
];

const FeaturesSection = () => {
    return (
        <section className="bg-[#f8f7ff] py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* HEADING */}
                <div className="text-center mb-16">
                    <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                        Platform Features
                    </span>
                    <h2 className="text-4xl font-bold text-purple-950 mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Everything Your School Needs
                    </h2>
                    <p className="text-purple-500 max-w-2xl mx-auto text-lg">
                        A complete school management ecosystem built
                        for Nigerian secondary schools.
                    </p>
                </div>

                {/* FEATURES GRID */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div key={index}
                            className="bg-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-200 group">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-100 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="font-bold text-purple-900 mb-2 text-base"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {feature.title}
                            </h3>
                            <p className="text-purple-500 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;