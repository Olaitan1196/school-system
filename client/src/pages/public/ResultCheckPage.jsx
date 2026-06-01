import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResultCheckPage = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [error, setError] = useState('');

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            toast.error('Please enter your result token.');
            return;
        }
        setLoading(true);
        setError('');
        setResultData(null);
        try {
            const res = await api.get(`/scores/result/token/${token.trim()}`);
            setResultData(res.data.data);
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid token.';
            setError(message);
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
        <div className="min-h-screen bg-[#f8f7ff]">

            {/* NAVBAR */}
            <nav className="bg-white border-b border-purple-100 px-4 sm:px-8 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <p className="font-bold text-purple-900"
                       style={{ fontFamily: "'Playfair Display', serif" }}>
                        Comforters' College
                    </p>
                </Link>
                <Link to="/" className="text-purple-500 hover:text-purple-700 text-sm transition-colors">
                    ← Back to Home
                </Link>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-16">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                        📊
                    </div>
                    <h1 className="text-3xl font-bold text-purple-950 mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Result Checking Portal
                    </h1>
                    <p className="text-purple-400">
                        Enter your result access token to view your academic results
                    </p>
                </div>

                {/* TOKEN FORM */}
                <div className="card mb-6">
                    <form onSubmit={handleCheck} className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Result Access Token</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value.toUpperCase())}
                                className="input-field font-mono text-center text-lg tracking-wider"
                                placeholder="CC-2024-XXXX-XXXX-XXXX"
                            />
                            <p className="text-purple-400 text-xs mt-1">
                                Your token was generated after completing all payments.
                                Contact the school admin if you do not have a token.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-red-600 text-sm">❌ {error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Checking...
                                </span>
                            ) : (
                                '🔍 Check Result'
                            )}
                        </button>
                    </form>
                </div>

                {resultData && (
                    <div className="space-y-4" id="result-print-area">

                        {/* PRINT ONLY HEADER */}
                        <div className="hidden print:block text-center mb-4">
                            <h1 className="text-2xl font-bold"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                COMFORTERS' COLLEGE
                            </h1>
                            <p className="text-sm">Excellence in Education</p>
                            <p className="text-sm font-semibold mt-1">STUDENT REPORT CARD</p>
                            <div className="border-t-2 border-b-2 border-gray-800 my-2 py-1">
                                <p className="text-xs">
                                    {resultData.report_card.term_name} · {resultData.report_card.session_name}
                                </p>
                            </div>
                        </div>

                        {/* REPORT CARD HEADER */}
                        <div className="card bg-gradient-to-br from-purple-950 to-fuchsia-900 border-0 print-purple-bg">
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
                                    {
                                        label: 'Position',
                                        value: resultData.report_card.position_in_class
                                            ? `${resultData.report_card.position_in_class}${resultData.report_card.position_suffix}`
                                            : 'N/A'
                                    },
                                ].map((item) => (
                                    <div key={item.label} className="bg-white/10 rounded-xl p-3">
                                        <p className="text-purple-300 text-xs">{item.label}</p>
                                        <p className="text-white font-medium text-sm mt-0.5">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUMMARY */}
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
                                            <th>CA1 /20</th>
                                            <th>CA2 /20</th>
                                            <th>CA3 /20</th>
                                            <th>Exam /60</th>
                                            <th>Total /100</th>
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
                                                <td className="text-purple-500 text-sm">{score.remark}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ATTENDANCE */}
                        {resultData.attendance && (
                            <div className="card">
                                <h3 className="section-title mb-3">Attendance Summary</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total Days', value: resultData.attendance.total_days },
                                        { label: 'Present', value: resultData.attendance.days_present },
                                        { label: 'Absent', value: resultData.attendance.days_absent },
                                        { label: 'Late', value: resultData.attendance.days_late },
                                    ].map((stat) => (
                                        <div key={stat.label} className="text-center">
                                            <p className="text-xl font-bold text-purple-900">
                                                {stat.value || 0}
                                            </p>
                                            <p className="text-purple-400 text-xs">{stat.label}</p>
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
                                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
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
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE AREA - ONLY SHOWS ON PRINT */}
                        <div className="hidden print:block mt-8">
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
                            <div className="text-center mt-6 text-xs text-gray-500">
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
                    </div>
                )}

                {/* NO TOKEN INFO */}
                {!resultData && !loading && (
                    <div className="text-center">
                        <p className="text-purple-400 text-sm mb-4">
                            Don't have a token? You need to complete all fee payments first.
                        </p>
                        <Link to="/login/student"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium underline transition-colors">
                            Login to Student Portal →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultCheckPage;