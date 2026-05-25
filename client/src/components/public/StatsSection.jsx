const stats = [
    { number: 'JSS 1-3', label: 'Junior Secondary', icon: '📚' },
    { number: 'SSS 1-3', label: 'Senior Secondary', icon: '🎓' },
    { number: '3 Streams', label: 'Science, Humanities, Business', icon: '🔬' },
    { number: '3 Terms', label: 'Academic Structure', icon: '📅' },
];

const StatsSection = () => {
    return (
        <section className="bg-[#f8f7ff] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index}
                            className="bg-white rounded-2xl p-6 text-center shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-300 transition-all duration-200">
                            <div className="text-4xl mb-3">{stat.icon}</div>
                            <div className="text-2xl font-bold text-purple-900 mb-1"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {stat.number}
                            </div>
                            <div className="text-sm text-purple-500 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;