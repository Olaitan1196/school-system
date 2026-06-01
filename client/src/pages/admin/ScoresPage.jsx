import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ScoresPage = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [scores, setScores] = useState([]);
    const [activeTab, setActiveTab] = useState('entry');

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    // FETCH SUBJECTS
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await api.get('/academic/subjects');
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
        queryKey: ['terms', selectedSession],
        queryFn: async () => {
            const params = selectedSession
                ? `?session_id=${selectedSession}`
                : '';
            const res = await api.get(`/academic/terms${params}`);
            return res.data;
        },
        enabled: true
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
        onSuccess: (data) => {
            const initialScores = data.data.map((student) => ({
                student_id: student.student_id,
                first_name: student.first_name,
                last_name: student.last_name,
                admission_number: student.admission_number,
                ca1_score: '',
                ca2_score: '',
                ca3_score: '',
                exam_score: '',
                is_absent: false
            }));
            setScores(initialScores);
        }
    });

    // FETCH EXISTING SCORES
    const { data: existingScores } = useQuery({
        queryKey: ['class-scores', selectedClass, selectedSubject, selectedTerm],
        queryFn: async () => {
            const res = await api.get(
                `/scores/class?class_id=${selectedClass}&subject_id=${selectedSubject}&term_id=${selectedTerm}`
            );
            return res.data;
        },
        enabled: !!(selectedClass && selectedSubject && selectedTerm),
        onSuccess: (data) => {
            if (data.data.length > 0) {
                setScores(prev => prev.map(student => {
                    const existing = data.data.find(
                        s => s.student_id === student.student_id
                    );
                    if (existing) {
                        return {
                            ...student,
                            ca1_score: existing.ca1_score || '',
                            ca2_score: existing.ca2_score || '',
                            ca3_score: existing.ca3_score || '',
                            exam_score: existing.exam_score || '',
                            is_absent: existing.is_absent || false
                        };
                    }
                    return student;
                }));
            }
        }
    });

    // BULK SCORES MUTATION
    const bulkScoresMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/scores/bulk', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save scores.');
        }
    });

    // GENERATE REPORT CARDS
    const generateReportsMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/scores/report-cards/generate', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // CALCULATE RANKINGS
    const rankingsMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/scores/rankings/calculate', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // PUBLISH RESULTS
    const publishMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/scores/report-cards/publish', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handleScoreChange = (studentId, field, value) => {
        setScores(prev => prev.map(s =>
            s.student_id === studentId
                ? { ...s, [field]: value }
                : s
        ));
    };

    const handleSaveScores = () => {
        if (!selectedClass || !selectedSubject || !selectedSession || !selectedTerm) {
            toast.error('Please select class, subject, session and term first.');
            return;
        }
        bulkScoresMutation.mutate({
            subject_id: selectedSubject,
            class_id: selectedClass,
            session_id: selectedSession,
            term_id: selectedTerm,
            scores: scores.map(s => ({
                student_id: s.student_id,
                ca1_score: parseFloat(s.ca1_score) || 0,
                ca2_score: parseFloat(s.ca2_score) || 0,
                ca3_score: parseFloat(s.ca3_score) || 0,
                exam_score: parseFloat(s.exam_score) || 0,
                is_absent: s.is_absent
            }))
        });
    };

    const classes = classesData?.data ?? [];
    const subjects = subjectsData?.data ?? [];
    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];

    const tabs = [
        { id: 'entry', label: 'Score Entry', icon: '📝' },
        { id: 'reports', label: 'Report Cards', icon: '📊' },
        { id: 'publish', label: 'Publish Results', icon: '📤' },
        { id: 'print', label: 'Print Results', icon: '🖨️' },
    ];

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Scores & Results</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Enter scores, generate report cards and publish results
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
                <h2 className="section-title mb-4">Select Parameters</h2>
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
                        <label className="form-label">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Select subject</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* SCORE ENTRY TAB */}
            {activeTab === 'entry' && (
                <div className="card p-0 overflow-hidden">
                    {!selectedClass || !selectedSession ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📝</div>
                            <p className="text-purple-400 font-medium">
                                Select a session and class to load students
                            </p>
                        </div>
                    ) : loadingStudents ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">🎓</div>
                            <p className="text-purple-400 font-medium">
                                No students found in this class
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* SCORE LIMITS INFO */}
                            <div className="p-4 bg-purple-50 border-b border-purple-100">
                                <div className="flex flex-wrap gap-4 text-xs text-purple-600">
                                    <span>📌 CA1: max 20</span>
                                    <span>📌 CA2: max 20</span>
                                    <span>📌 CA3: max 20</span>
                                    <span>📌 Exam: max 60</span>
                                    <span>📌 Total: 100</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>CA1 /20</th>
                                            <th>CA2 /20</th>
                                            <th>CA3 /20</th>
                                            <th>Exam /60</th>
                                            <th>Total</th>
                                            <th>Absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scores.map((student) => {
                                            const total =
                                                (parseFloat(student.ca1_score) || 0) +
                                                (parseFloat(student.ca2_score) || 0) +
                                                (parseFloat(student.ca3_score) || 0) +
                                                (parseFloat(student.exam_score) || 0);

                                            const gradeColor = total >= 70
                                                ? 'text-green-600'
                                                : total >= 50
                                                ? 'text-blue-600'
                                                : total >= 40
                                                ? 'text-yellow-600'
                                                : 'text-red-600';

                                            return (
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
                                                    {['ca1_score', 'ca2_score', 'ca3_score', 'exam_score'].map((field) => (
                                                        <td key={field}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={field === 'exam_score' ? 60 : 20}
                                                                value={student[field]}
                                                                onChange={(e) => handleScoreChange(
                                                                    student.student_id,
                                                                    field,
                                                                    e.target.value
                                                                )}
                                                                disabled={student.is_absent}
                                                                className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:text-gray-400"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td>
                                                        <span className={`font-bold text-sm ${gradeColor}`}>
                                                            {student.is_absent ? 'ABS' : total.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={student.is_absent}
                                                            onChange={(e) => handleScoreChange(
                                                                student.student_id,
                                                                'is_absent',
                                                                e.target.checked
                                                            )}
                                                            className="w-4 h-4 accent-red-500"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* SAVE BUTTON */}
                            <div className="p-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSaveScores}
                                    disabled={bulkScoresMutation.isPending || !selectedSubject || !selectedTerm}
                                    className="btn-primary"
                                >
                                    {bulkScoresMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </span>
                                    ) : (
                                        'Save All Scores'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* REPORT CARDS TAB */}
            {activeTab === 'reports' && (
                <div className="card">
                    <h2 className="section-title mb-2">Generate Report Cards</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        This will calculate totals and averages for all
                        students in the selected class and term.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                            <div className="text-3xl mb-3">📊</div>
                            <h3 className="font-bold text-purple-900 mb-2">
                                Generate Report Cards
                            </h3>
                            <p className="text-purple-500 text-sm mb-4">
                                Calculate totals, averages and generate
                                report cards for all students in selected class.
                            </p>
                            <button
                                onClick={() => {
                                    if (!selectedClass || !selectedSession || !selectedTerm) {
                                        toast.error('Select class, session and term first.');
                                        return;
                                    }
                                    generateReportsMutation.mutate({
                                        class_id: selectedClass,
                                        session_id: selectedSession,
                                        term_id: selectedTerm
                                    });
                                }}
                                disabled={generateReportsMutation.isPending}
                                className="btn-primary w-full"
                            >
                                {generateReportsMutation.isPending
                                    ? 'Generating...'
                                    : 'Generate Report Cards'
                                }
                            </button>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                            <div className="text-3xl mb-3">🏆</div>
                            <h3 className="font-bold text-purple-900 mb-2">
                                Calculate Class Rankings
                            </h3>
                            <p className="text-purple-500 text-sm mb-4">
                                Calculate positions and rankings for all
                                students. Run this after generating report cards.
                            </p>
                            <button
                                onClick={() => {
                                    if (!selectedClass || !selectedSession || !selectedTerm) {
                                        toast.error('Select class, session and term first.');
                                        return;
                                    }
                                    rankingsMutation.mutate({
                                        class_id: selectedClass,
                                        session_id: selectedSession,
                                        term_id: selectedTerm
                                    });
                                }}
                                disabled={rankingsMutation.isPending}
                                className="btn-primary w-full"
                            >
                                {rankingsMutation.isPending
                                    ? 'Calculating...'
                                    : 'Calculate Rankings'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PUBLISH TAB */}
            {activeTab === 'publish' && (
                <div className="card">
                    <h2 className="section-title mb-2">Publish Results</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        Publishing makes results visible to students
                        who have completed their payments.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-yellow-800 text-sm">
                                    Before publishing make sure:
                                </p>
                                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                                    <li>✓ All scores have been entered</li>
                                    <li>✓ Report cards have been generated</li>
                                    <li>✓ Rankings have been calculated</li>
                                    <li>✓ Teacher and principal remarks are added</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!selectedClass || !selectedSession || !selectedTerm) {
                                toast.error('Select class, session and term first.');
                                return;
                            }
                            publishMutation.mutate({
                                class_id: selectedClass,
                                session_id: selectedSession,
                                term_id: selectedTerm
                            });
                        }}
                        disabled={publishMutation.isPending}
                        className="btn-primary"
                    >
                        {publishMutation.isPending
                            ? 'Publishing...'
                            : '📤 Publish Results for Selected Class & Term'
                        }
                    </button>
                </div>
            )}
            {/* PRINT TAB */}
            {activeTab === 'print' && (
                <div className="card">
                    <h2 className="section-title mb-2">Print Results</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        Print result cards for individual students
                        or mass print for an entire class.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6">

                        {/* SINGLE STUDENT PRINT */}
                        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                            <div className="text-3xl mb-3">👤</div>
                            <h3 className="font-bold text-purple-900 mb-2">
                                Print Single Student Result
                            </h3>
                            <p className="text-purple-500 text-sm mb-4">
                                Search for a student and print
                                their result for a specific term.
                            </p>
                            <PrintSingleResult
                                sessions={sessions}
                                terms={terms}
                            />
                        </div>

                        {/* MASS PRINT */}
                        <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
                            <div className="text-3xl mb-3">👥</div>
                            <h3 className="font-bold text-purple-900 mb-2">
                                Mass Print by Class
                            </h3>
                            <p className="text-purple-500 text-sm mb-4">
                                Print all results for an entire
                                class for a specific term at once.
                            </p>
                            <div className="space-y-3">
                                <p className="text-purple-400 text-xs">
                                    Select class, session and term above
                                    then click print below.
                                </p>
                                <button
                                    onClick={() => {
                                        if (!selectedClass || !selectedTerm || !selectedSession) {
                                            toast.error('Select class, session and term first.');
                                            return;
                                        }
                                        window.open(
                                            `/admin/scores/mass-print?class_id=${selectedClass}&term_id=${selectedTerm}&session_id=${selectedSession}`,
                                            '_blank'
                                        );
                                    }}
                                    className="btn-primary w-full text-sm"
                                >
                                    🖨️ Mass Print Class Results
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

// ============================================
// PRINT SINGLE RESULT COMPONENT
// ============================================
const PrintSingleResult = ({ sessions, terms }) => {
    const [search, setSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(false);

    const searchStudent = async () => {
        if (!search) return;
        setSearching(true);
        try {
            const res = await api.get(`/students?search=${search}&limit=1`);
            if (res.data.data.length > 0) {
                setFoundStudent(res.data.data[0]);
            } else {
                toast.error('Student not found.');
                setFoundStudent(null);
            }
        } catch (error) {
            toast.error('Search failed.');
        } finally {
            setSearching(false);
        }
    };

    const fetchAndPrint = async () => {
        if (!foundStudent || !selectedTerm) {
            toast.error('Select a student and term first.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(
                `/scores/admin/result/${foundStudent.id}/${selectedTerm}`
            );
            setResultData(res.data.data);
            setTimeout(() => window.print(), 500);
        } catch (error) {
            toast.error('Result not found for this student and term.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field text-sm"
                    placeholder="Search student"
                    onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                />
                <button
                    onClick={searchStudent}
                    disabled={searching}
                    className="btn-primary px-3 text-sm whitespace-nowrap"
                >
                    {searching ? '...' : 'Find'}
                </button>
            </div>

            {foundStudent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm">
                    <p className="text-green-800 font-medium">
                        ✓ {foundStudent.first_name} {foundStudent.last_name}
                    </p>
                    <p className="text-green-600 text-xs">{foundStudent.admission_number}</p>
                </div>
            )}

            <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="input-field text-sm"
            >
                <option value="">Select term</option>
                {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.term_name}
                    </option>
                ))}
            </select>

            <button
                onClick={fetchAndPrint}
                disabled={loading || !foundStudent || !selectedTerm}
                className="btn-primary w-full text-sm"
            >
                {loading ? 'Loading...' : '🖨️ Print Result'}
            </button>

            {/* HIDDEN PRINT AREA */}
            {resultData && (
                <div id="result-print-area" className="hidden print:block">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold">COMFORTERS' COLLEGE</h1>
                        <p className="text-sm">Excellence in Education</p>
                        <p className="font-semibold mt-1">STUDENT REPORT CARD</p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Name:</strong> {resultData.report_card.first_name} {resultData.report_card.last_name}
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Admission No:</strong> {resultData.report_card.admission_number}
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Class:</strong> {resultData.report_card.class_name}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Term:</strong> {resultData.report_card.term_name}
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Session:</strong> {resultData.report_card.session_name}
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Position:</strong>{' '}
                                    {resultData.report_card.position_in_class
                                        ? `${resultData.report_card.position_in_class}${resultData.report_card.position_suffix}`
                                        : 'N/A'
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <br />

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Subject</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>CA1</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>CA2</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>CA3</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Exam</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Total</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Grade</th>
                                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultData.scores.map((score) => (
                                <tr key={score.id}>
                                    <td style={{ border: '1px solid #ccc', padding: '6px' }}>{score.subject_name}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{score.ca1_score}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{score.ca2_score}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{score.ca3_score}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{score.exam_score}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {parseFloat(score.total_score).toFixed(1)}
                                    </td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{score.grade}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '6px' }}>{score.remark}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <br />

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Total Score:</strong> {parseFloat(resultData.report_card.total_score_obtained).toFixed(1)}/{resultData.report_card.total_score_obtainable}
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>Average:</strong> {parseFloat(resultData.report_card.average_score).toFixed(1)}%
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                    <strong>No. of Subjects:</strong> {resultData.report_card.number_of_subjects}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {resultData.report_card.class_teacher_remark && (
                        <div style={{ marginTop: '12px', padding: '8px', border: '1px solid #ccc' }}>
                            <strong>Class Teacher's Remark:</strong> {resultData.report_card.class_teacher_remark}
                        </div>
                    )}

                    {resultData.report_card.principal_remark && (
                        <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #ccc' }}>
                            <strong>Principal's Remark:</strong> {resultData.report_card.principal_remark}
                        </div>
                    )}

                    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
                        <div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '40px' }}>
                                Class Teacher's Signature
                            </div>
                        </div>
                        <div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '40px' }}>
                                School Stamp
                            </div>
                        </div>
                        <div>
                            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '40px' }}>
                                Principal's Signature
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#666' }}>
                        <p>Comforters' College · Excellence in Education</p>
                        <p>Printed on: {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoresPage;