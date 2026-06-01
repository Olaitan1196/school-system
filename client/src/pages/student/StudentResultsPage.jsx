import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentResultsPage = () => {
    const { user } = useAuth();
    const [selectedTerm, setSelectedTerm] = useState('');
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(false);

    // FETCH TERMS
    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    const terms = termsData?.data ?? [];

    const fetchResult = async () => {
        if (!selectedTerm || !user?.student_id) {
            toast.error('Please select a term.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(
                `/scores/report-cards/${user.student_id}/${selectedTerm}`
            );
            setResultData(res.data.data);
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('Result not found for this term. Contact admin.');
            } else {
                toast.error('Failed to load result.');
            }
            setResultData(null);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade) => {
        const colors = {
            A: 'text-green-600',
            B: 'text-blue-600',
            C: 'text-yellow-600',
            D: 'text-orange-600',
            E: 'text-orange-600',
            F: 'text-red-600',
        };
        return colors[grade] || 'text-purple-700';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">My Results</h1>
                <p className="text-purple-400 text-sm mt-1">
                    View your academic performance
                </p>
            </div>

            {/* SELECT TERM */}
            <div className="card">
                <h2 className="section-title mb-4">Select Term</h2>
                <div className="flex gap-3">
                    <select
                        value={selectedTerm}
                        onChange={(e) => {
                            setSelectedTerm(e.target.value);
                            setResultData(null);
                        }}
                        className="input-field"
                    >
                        <option value="">Select term</option>
                        {terms.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.term_name} · {t.session_name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={fetchResult}
                        disabled={loading || !selectedTerm}
                        className="btn-primary whitespace-nowrap"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Loading...
                            </span>
                        ) : (
                            'View Result'
                        )}
                    </button>
                </div>
            </div>

            {/* RESULT DISPLAY */}
            {resultData && (
                <div className="space-y-4" id="result-print-area">

                    {/* RESULT NOT PUBLISHED */}
                    {!resultData.report_card.is_published && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <span className="text-2xl">⏳</span>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        Result Not Yet Published
                                    </p>
                                    <p className="text-yellow-600 text-sm mt-1">
                                        Your result for this term has not been published yet.
                                        Please check back later or contact your class teacher.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {resultData.report_card.is_published && (
                        <>
                            {/* REPORT CARD HEADER */}
                            <div className="card bg-gradient-to-br from-purple-950 to-fuchsia-900 border-0">
                                <div className="text-center mb-4">
                                    <h2 className="text-2xl font-bold text-white"
                                        style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Comforters' College
                                    </h2>
                                    <p className="text-purple-200 text-sm">Student Report Card</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                    {[
                                        { label: 'Name', value: `${resultData.report_card.first_name} ${resultData.report_card.last_name}` },
                                        { label: 'Admission No.', value: resultData.report_card.admission_number },
                                        { label: 'Class', value: resultData.report_card.class_name },
                                        { label: 'Term', value: resultData.report_card.term_name },
                                        { label: 'Session', value: resultData.report_card.session_name },
                                        { label: 'Position', value: resultData.report_card.position_in_class ? `${resultData.report_card.position_in_class}${resultData.report_card.position_suffix} of ${resultData.report_card.total_students || '?'}` : 'N/A' },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-white/10 rounded-xl p-3">
                                            <p className="text-purple-300 text-xs">{item.label}</p>
                                            <p className="text-white font-medium text-sm mt-0.5">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SUMMARY STATS */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        label: 'Total Score',
                                        value: `${parseFloat(resultData.report_card.total_score_obtained).toFixed(1)}/${resultData.report_card.total_score_obtainable}`,
                                        color: 'bg-purple-50 text-purple-700'
                                    },
                                    {
                                        label: 'Average',
                                        value: `${parseFloat(resultData.report_card.average_score).toFixed(1)}%`,
                                        color: 'bg-blue-50 text-blue-700'
                                    },
                                    {
                                        label: 'Subjects',
                                        value: resultData.report_card.number_of_subjects,
                                        color: 'bg-green-50 text-green-700'
                                    },
                                ].map((stat) => (
                                    <div key={stat.label}
                                        className={`${stat.color} rounded-xl p-4 text-center`}>
                                        <p className="text-2xl font-bold"
                                           style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-sm mt-1 opacity-75">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* SCORES TABLE */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="section-title">Subject Scores</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>CA1</th>
                                                <th>CA2</th>
                                                <th>CA3</th>
                                                <th>Exam</th>
                                                <th>Total</th>
                                                <th>Grade</th>
                                                <th>Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultData.scores.map((score) => (
                                                <tr key={score.id}>
                                                    <td className="font-medium text-purple-900 text-sm">
                                                        {score.subject_name}
                                                    </td>
                                                    <td className="text-purple-600 text-sm">{score.ca1_score}</td>
                                                    <td className="text-purple-600 text-sm">{score.ca2_score}</td>
                                                    <td className="text-purple-600 text-sm">{score.ca3_score}</td>
                                                    <td className="text-purple-600 text-sm">{score.exam_score}</td>
                                                    <td className="font-bold text-purple-900">
                                                        {parseFloat(score.total_score).toFixed(1)}
                                                    </td>
                                                    <td>
                                                        <span className={`font-bold text-lg ${getGradeColor(score.grade)}`}>
                                                            {score.grade}
                                                        </span>
                                                    </td>
                                                    <td className="text-purple-500 text-sm">
                                                        {score.remark}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ATTENDANCE SUMMARY */}
                            {resultData.attendance && (
                                <div className="card">
                                    <h3 className="section-title mb-4">Attendance Summary</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Total Days', value: resultData.attendance.total_days, color: 'bg-purple-50 text-purple-700' },
                                            { label: 'Present', value: resultData.attendance.days_present, color: 'bg-green-50 text-green-700' },
                                            { label: 'Absent', value: resultData.attendance.days_absent, color: 'bg-red-50 text-red-700' },
                                            { label: 'Late', value: resultData.attendance.days_late, color: 'bg-yellow-50 text-yellow-700' },
                                        ].map((stat) => (
                                            <div key={stat.label}
                                                className={`${stat.color} rounded-xl p-3 text-center`}>
                                                <p className="text-xl font-bold">{stat.value || 0}</p>
                                                <p className="text-xs mt-0.5 opacity-75">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REMARKS */}
                            {(resultData.report_card.class_teacher_remark ||
                                resultData.report_card.principal_remark) && (
                                <div className="card">
                                    <h3 className="section-title mb-4">Remarks</h3>
                                    <div className="space-y-3">
                                        {resultData.report_card.class_teacher_remark && (
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                <p className="text-purple-400 text-xs mb-1">
                                                    Class Teacher's Remark
                                                </p>
                                                <p className="text-purple-900 text-sm font-medium">
                                                    {resultData.report_card.class_teacher_remark}
                                                </p>
                                            </div>
                                        )}
                                        {resultData.report_card.principal_remark && (
                                            <div className="bg-fuchsia-50 rounded-xl p-4 border border-fuchsia-100">
                                                <p className="text-fuchsia-400 text-xs mb-1">
                                                    Principal's Remark
                                                </p>
                                                <p className="text-fuchsia-900 text-sm font-medium">
                                                    {resultData.report_card.principal_remark}
                                                </p>
                                            </div>
                                        )}
                                        {resultData.report_card.next_term_begins && (
                                            <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-center gap-3">
                                                <span className="text-xl">📅</span>
                                                <div>
                                                    <p className="text-green-600 text-xs">Next Term Begins</p>
                                                    <p className="text-green-800 font-semibold text-sm">
                                                        {new Date(resultData.report_card.next_term_begins).toLocaleDateString('en-NG', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SIGNATURE AREA - PRINT ONLY */}
                            <div className="hidden print:block mt-8 card">
                                <div className="grid grid-cols-3 gap-8 text-center text-sm">
                                    <div>
                                        <div className="border-t border-gray-400 pt-2 mt-8">
                                            Class Teacher's Signature
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-t border-gray-400 pt-2 mt-8">
                                            School Stamp
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-t border-gray-400 pt-2 mt-8">
                                            Principal's Signature
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4 text-xs text-gray-500">
                                    <p>Comforters' College · Excellence in Education</p>
                                    <p>Printed on: {new Date().toLocaleDateString('en-NG', {
                                        weekday: 'long', year: 'numeric',
                                        month: 'long', day: 'numeric'
                                    })}</p>
                                </div>
                            </div>

                            {/* PRINT BUTTON */}
                            <div className="flex justify-end no-print">
                                <button
                                    onClick={() => window.print()}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    🖨️ Print Result
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentResultsPage;