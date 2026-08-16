import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AttendancePage = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [attendanceList, setAttendanceList] = useState([]);
    const [activeTab, setActiveTab] = useState('mark');

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    // FETCH SESSIONS
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // FETCH TERMS
    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    // FETCH STUDENTS IN CLASS
const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', selectedClass, selectedSession],
    queryFn: async () => {
        const res = await api.get(
            `/academic/classes/${selectedClass}/students?session_id=${selectedSession}`
        );
        return res.data;
    },
    enabled: !!(selectedClass && selectedSession),
    staleTime: 0,
    onSuccess: (data) => {
        const list = data.data.map((student) => ({
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            admission_number: student.admission_number,
            status: 'present',
            remark: ''
        }));
        setAttendanceList(list);
    }
});

// FETCH EXISTING ATTENDANCE FOR DATE
const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate, selectedTerm, selectedSession],
    queryFn: async () => {
        const res = await api.get(
            `/attendance/class?class_id=${selectedClass}&attendance_date=${selectedDate}&term_id=${selectedTerm}&session_id=${selectedSession}`
        );
        return res.data;
    },
    enabled: !!(selectedClass && selectedDate && selectedTerm && selectedSession),
    staleTime: 0,
    onSuccess: (data) => {
        if (data.data.length > 0) {
            setAttendanceList(prev => prev.map(student => {
                const existing = data.data.find(
                    a => a.student_id === student.student_id
                );
                if (existing) {
                    return {
                        ...student,
                        status: existing.status,
                        remark: existing.remark || ''
                    };
                }
                return student;
            }));
        }
    }
});

// FETCH CLASS ATTENDANCE SUMMARY
const { data: summaryData } = useQuery({
    queryKey: ['attendance-summary', selectedClass, selectedTerm],
    queryFn: async () => {
        const res = await api.get(
            `/attendance/class/summary?class_id=${selectedClass}&term_id=${selectedTerm}`
        );
        return res.data;
    },
    enabled: !!(selectedClass && selectedTerm) && activeTab === 'summary'
});

// MARK BULK ATTENDANCE
const markAttendanceMutation = useMutation({
    mutationFn: async (data) => {
        const res = await api.post('/attendance/bulk', data);
        return res.data;
    },
    onSuccess: (data) => {
        toast.success(data.message);
    },
    onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed.');
    }
});
    const handleStatusChange = (studentId, status) => {
        setAttendanceList(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    };

    const handleMarkAll = (status) => {
        setAttendanceList(prev => prev.map(s => ({ ...s, status })));
    };

    const handleSave = () => {
        if (!selectedClass || !selectedSession || !selectedTerm || !selectedDate) {
            toast.error('Please select all parameters first.');
            return;
        }
        markAttendanceMutation.mutate({
            class_id: selectedClass,
            session_id: selectedSession,
            term_id: selectedTerm,
            attendance_date: selectedDate,
            attendance_list: attendanceList.map(s => ({
                student_id: s.student_id,
                status: s.status,
                remark: s.remark
            }))
        });
    };

    const classes = classesData?.data ?? [];
    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];
    const summary = summaryData?.data ?? [];

    const tabs = [
        { id: 'mark', label: 'Mark Attendance', icon: '📅' },
        { id: 'summary', label: 'Summary', icon: '📊' },
    ];

    const presentCount = attendanceList.filter(s => s.status === 'present').length;
    const absentCount = attendanceList.filter(s => s.status === 'absent').length;
    const lateCount = attendanceList.filter(s => s.status === 'late').length;

    const statusColors = {
        present: 'bg-green-100 text-green-700 border-green-200',
        absent: 'bg-red-100 text-red-700 border-red-200',
        late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        excused: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Attendance</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Mark and track daily student attendance
                </p>
            </div>

            {/* TABS */}
            <div className="flex gap-1 bg-purple-50 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-purple-400 hover:text-purple-600'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* FILTERS */}
            <div className="card">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="form-group">
                        <label className="form-label">Session</label>
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Select session</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.session_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Term</label>
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Select term</option>
                            {terms.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.term_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Select class</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.class_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            {/* MARK ATTENDANCE TAB */}
            {activeTab === 'mark' && (
                <div className="card p-0 overflow-hidden">
                    {!selectedClass || !selectedSession ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📅</div>
                            <p className="text-purple-400 font-medium">
                                Select session and class to load students
                            </p>
                        </div>
                    ) : loadingStudents ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : attendanceList.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">🎓</div>
                            <p className="text-purple-400 font-medium">
                                No students found in this class
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* SUMMARY BAR */}
                            <div className="p-4 bg-purple-50 border-b border-purple-100">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-green-600 font-medium">
                                            ✅ Present: {presentCount}
                                        </span>
                                        <span className="text-red-600 font-medium">
                                            ❌ Absent: {absentCount}
                                        </span>
                                        <span className="text-yellow-600 font-medium">
                                            ⏰ Late: {lateCount}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 ml-auto">
                                        <button
                                            onClick={() => handleMarkAll('present')}
                                            className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                        >
                                            Mark All Present
                                        </button>
                                        <button
                                            onClick={() => handleMarkAll('absent')}
                                            className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
                                        >
                                            Mark All Absent
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ATTENDANCE TABLE */}
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Status</th>
                                            <th>Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceList.map((student) => (
                                            <tr key={student.student_id}>
                                                <td>
                                                    <div>
                                                        <p className="font-medium text-purple-900 text-sm">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-purple-400 text-xs">
                                                            {student.admission_number}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {['present', 'absent', 'late', 'excused'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(student.student_id, status)}
                                                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize transition-all ${
                                                                    student.status === status
                                                                        ? statusColors[status]
                                                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={student.remark}
                                                        onChange={(e) => setAttendanceList(prev =>
                                                            prev.map(s =>
                                                                s.student_id === student.student_id
                                                                    ? { ...s, remark: e.target.value }
                                                                    : s
                                                            )
                                                        )}
                                                        placeholder="Optional remark"
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* SAVE */}
                            <div className="p-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={markAttendanceMutation.isPending || !selectedTerm}
                                    className="btn-primary"
                                >
                                    {markAttendanceMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </span>
                                    ) : (
                                        'Save Attendance'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
                <div className="card p-0 overflow-hidden">
                    {!selectedClass || !selectedTerm ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📊</div>
                            <p className="text-purple-400 font-medium">
                                Select class and term to view summary
                            </p>
                        </div>
                    ) : summary.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📅</div>
                            <p className="text-purple-400 font-medium">
                                No attendance records found
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Total Days</th>
                                        <th>Present</th>
                                        <th>Absent</th>
                                        <th>Late</th>
                                        <th>Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map((student) => (
                                        <tr key={student.student_id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {student.first_name} {student.last_name}
                                                    </p>
                                                    <p className="text-purple-400 text-xs">
                                                        {student.admission_number}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="text-purple-700 font-medium">
                                                {student.total_days}
                                            </td>
                                            <td>
                                                <span className="text-green-600 font-medium">
                                                    {student.days_present}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-red-600 font-medium">
                                                    {student.days_absent}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-yellow-600 font-medium">
                                                    {student.days_late}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-24">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                parseFloat(student.attendance_percentage) >= 75
                                                                    ? 'bg-green-500'
                                                                    : parseFloat(student.attendance_percentage) >= 50
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${student.attendance_percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-bold ${
                                                        parseFloat(student.attendance_percentage) >= 75
                                                            ? 'text-green-600'
                                                            : parseFloat(student.attendance_percentage) >= 50
                                                            ? 'text-yellow-600'
                                                            : 'text-red-600'
                                                    }`}>
                                                        {student.attendance_percentage}%
                                                    </span>
                                                </div>
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

export default AttendancePage;