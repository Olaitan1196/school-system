import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentAttendancePage = () => {
    const { user } = useAuth();
    const [selectedTerm, setSelectedTerm] = useState('');

    // FETCH TERMS
    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    // FETCH MY ATTENDANCE SUMMARY
    const { data: summaryData } = useQuery({
        queryKey: ['my-attendance-summary', user?.student_id, selectedTerm],
        queryFn: async () => {
            const res = await api.get(
                `/attendance/student/${user.student_id}/summary?term_id=${selectedTerm}`
            );
            return res.data;
        },
        enabled: !!(user?.student_id && selectedTerm)
    });

    // FETCH MY ATTENDANCE RECORDS
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['my-attendance', user?.student_id, selectedTerm],
        queryFn: async () => {
            const res = await api.get(
                `/attendance/student/${user.student_id}?term_id=${selectedTerm}`
            );
            return res.data;
        },
        enabled: !!(user?.student_id && selectedTerm)
    });

    const terms = termsData?.data ?? [];
    const summary = summaryData?.data;
    const records = attendanceData?.data ?? [];

    const statusColors = {
        present: 'bg-green-100 text-green-700',
        absent: 'bg-red-100 text-red-700',
        late: 'bg-yellow-100 text-yellow-700',
        excused: 'bg-blue-100 text-blue-700',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">My Attendance</h1>
                <p className="text-purple-400 text-sm mt-1">
                    View your attendance records
                </p>
            </div>

            {/* SELECT TERM */}
            <div className="card">
                <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="input-field max-w-xs"
                >
                    <option value="">Select term</option>
                    {terms.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.term_name} · {t.session_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* SUMMARY */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Days', value: summary.total_days, color: 'bg-purple-50 text-purple-700' },
                        { label: 'Present', value: summary.days_present, color: 'bg-green-50 text-green-700' },
                        { label: 'Absent', value: summary.days_absent, color: 'bg-red-50 text-red-700' },
                        { label: 'Late', value: summary.days_late, color: 'bg-yellow-50 text-yellow-700' },
                        { label: 'Excused', value: summary.days_excused, color: 'bg-blue-50 text-blue-700' },
                        { label: 'Rate', value: `${summary.attendance_percentage}%`, color: 'bg-fuchsia-50 text-fuchsia-700' },
                    ].map((stat) => (
                        <div key={stat.label}
                            className={`${stat.color} rounded-xl p-4 text-center`}>
                            <p className="text-2xl font-bold"
                               style={{ fontFamily: "'Playfair Display', serif" }}>
                                {stat.value || 0}
                            </p>
                            <p className="text-xs mt-1 opacity-75">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ATTENDANCE RECORDS */}
            {selectedTerm && (
                <div className="card p-0 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📅</div>
                            <p className="text-purple-400 font-medium">
                                No attendance records found
                            </p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Status</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td className="text-purple-700 font-medium text-sm">
                                            {new Date(record.attendance_date).toLocaleDateString('en-NG', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="text-purple-500 text-sm">
                                            {new Date(record.attendance_date).toLocaleDateString('en-NG', {
                                                weekday: 'long'
                                            })}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                statusColors[record.status]
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="text-purple-400 text-sm">
                                            {record.remark || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentAttendancePage;