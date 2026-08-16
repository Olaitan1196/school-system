import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TeacherClassesPage = () => {
    const { user } = useAuth();
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSession, setSelectedSession] = useState('');

    // FETCH MY ASSIGNMENTS - Direct fetch
const [teacherData, setTeacherData] = useState(null);

useEffect(() => {
    if (!user?.teacher_id) return;

    const fetchTeacherData = async () => {
        try {
            const res = await api.get(`/teachers/${user.teacher_id}`);
            setTeacherData(res.data);
        } catch (error) {
            console.error('Error fetching teacher data:', error);
        }
    };

    fetchTeacherData();
}, [user?.teacher_id]);

    // FETCH SESSIONS
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // FETCH STUDENTS IN SELECTED CLASS
    const { data: studentsData, isLoading: loadingStudents } = useQuery({
        queryKey: ['class-students', selectedClass?.class_id, selectedSession],
        queryFn: async () => {
            const res = await api.get(
                `/academic/classes/${selectedClass.class_id}/students?session_id=${selectedSession}`
            );
            return res.data;
        },
        enabled: !!(selectedClass && selectedSession)
    });

    const assignments = teacherData?.assignments ?? [];
    const sessions = sessionsData?.data ?? [];
    const students = studentsData?.data ?? [];

    // GROUP ASSIGNMENTS BY CLASS
    const classesByName = assignments.reduce((acc, assignment) => {
        const key = assignment.class_name;
        if (!acc[key]) {
            acc[key] = {
                class_id: assignment.class_id,
                class_name: assignment.class_name,
                stream_name: assignment.stream_name,
                is_class_teacher: assignment.is_class_teacher,
                subjects: []
            };
        }
        acc[key].subjects.push(assignment.subject_name);
        if (assignment.is_class_teacher) {
            acc[key].is_class_teacher = true;
        }
        return acc;
    }, {});

    const classes = Object.values(classesByName);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">My Classes</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Classes and subjects assigned to you
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.length === 0 ? (
                    <div className="col-span-3 card text-center py-16">
                        <div className="text-5xl mb-3">🏫</div>
                        <p className="text-purple-400 font-medium">
                            No classes assigned yet
                        </p>
                        <p className="text-purple-300 text-sm mt-1">
                            Contact admin to assign you to classes
                        </p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <button
                            key={cls.class_name}
                            onClick={() => setSelectedClass(cls)}
                            className={`card text-left hover:border-violet-300 hover:shadow-md transition-all ${
                                selectedClass?.class_name === cls.class_name
                                    ? 'border-violet-500 bg-violet-50'
                                    : ''
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <span className="text-violet-700 font-bold text-sm">
                                        {cls.class_name.split(' ')[0]}
                                    </span>
                                </div>
                                {cls.is_class_teacher && (
                                    <span className="badge-purple text-xs">
                                        Class Teacher
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-purple-900 mb-2"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {cls.class_name}
                                {cls.stream_name ? ` (${cls.stream_name})` : ''}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                                {cls.subjects.map((subject) => (
                                    <span key={subject}
                                        className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* STUDENTS IN CLASS */}
            {selectedClass && (
                <div className="card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h2 className="section-title">
                            Students in {selectedClass.class_name}
                        </h2>
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="input-field w-auto"
                        >
                            <option value="">Select session</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.session_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedSession ? (
                        <p className="text-purple-400 text-sm text-center py-8">
                            Select a session to view students
                        </p>
                    ) : loadingStudents ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : students.length === 0 ? (
                        <p className="text-purple-400 text-sm text-center py-8">
                            No students enrolled in this class
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Admission No.</th>
                                        <th>Gender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.student_id}>
                                            <td className="text-purple-400 text-sm">
                                                {index + 1}
                                            </td>
                                            <td>
                                                <p className="font-medium text-purple-900 text-sm">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                            </td>
                                            <td>
                                                <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                    {student.admission_number}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    student.gender === 'Male'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-pink-100 text-pink-700'
                                                }`}>
                                                    {student.gender}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherClassesPage;