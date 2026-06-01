import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // FETCH MY ASSIGNMENTS
    const { data: assignmentsData } = useQuery({
        queryKey: ['my-assignments', user?.teacher_id],
        queryFn: async () => {
            const res = await api.get(`/teachers/${user.teacher_id}`);
            return res.data;
        },
        enabled: !!user?.teacher_id
    });

    const assignments = assignmentsData?.data?.assignments ?? [];
    const uniqueClasses = [...new Set(assignments.map(a => a.class_name))];
    const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name))];

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Welcome to your teacher portal
                </p>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: '🏫',
                        label: 'My Classes',
                        value: uniqueClasses.length,
                        color: 'bg-violet-50',
                        path: '/teacher/classes'
                    },
                    {
                        icon: '📚',
                        label: 'My Subjects',
                        value: uniqueSubjects.length,
                        color: 'bg-purple-50',
                        path: '/teacher/scores'
                    },
                    {
                        icon: '📝',
                        label: 'Score Entry',
                        value: 'Enter',
                        color: 'bg-blue-50',
                        path: '/teacher/scores'
                    },
                    {
                        icon: '📅',
                        label: 'Attendance',
                        value: 'Mark',
                        color: 'bg-green-50',
                        path: '/teacher/attendance'
                    },
                ].map((stat) => (
                    <button
                        key={stat.label}
                        onClick={() => navigate(stat.path)}
                        className="bg-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all text-left w-full"
                    >
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                            {stat.icon}
                        </div>
                        <div className="text-3xl font-bold text-purple-950 mb-1"
                             style={{ fontFamily: "'Playfair Display', serif" }}>
                            {stat.value}
                        </div>
                        <div className="text-purple-500 text-sm font-medium">
                            {stat.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* MY ASSIGNMENTS */}
            <div className="card">
                <h2 className="section-title mb-4">My Teaching Assignments</h2>
                {assignments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">📚</div>
                        <p className="text-purple-400 text-sm">
                            No assignments found. Contact admin to assign you to classes.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignments.map((assignment) => (
                            <div key={assignment.id}
                                className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                                <p className="font-semibold text-purple-900 text-sm">
                                    {assignment.subject_name}
                                </p>
                                <p className="text-purple-500 text-xs mt-1">
                                    {assignment.class_name}
                                    {assignment.stream_name ? ` · ${assignment.stream_name}` : ''}
                                </p>
                                <p className="text-purple-400 text-xs mt-1">
                                    {assignment.session_name}
                                </p>
                                {assignment.is_class_teacher && (
                                    <span className="badge-purple text-xs mt-2 inline-block">
                                        Class Teacher
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="card">
                <h2 className="section-title mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: '📝', label: 'Enter Scores', path: '/teacher/scores' },
                        { icon: '📅', label: 'Mark Attendance', path: '/teacher/attendance' },
                        { icon: '❓', label: 'Add Questions', path: '/teacher/questions' },
                        { icon: '🏫', label: 'View Classes', path: '/teacher/classes' },
                    ].map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-violet-200 hover:bg-violet-50 text-violet-700 transition-all"
                        >
                            <span className="text-2xl">{action.icon}</span>
                            <span className="text-xs font-medium text-center">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;