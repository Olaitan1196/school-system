import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BulkImportQuestionsModal from '../../components/admin/BulkImportQuestionsModal';

const CBTPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('exams');
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showCreateExamModal, setShowCreateExamModal] = useState(false);
    const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [sessionExamFilter, setSessionExamFilter] = useState('');
    const [viewingTokensSession, setViewingTokensSession] = useState(null);

    // FETCH EXAMS
    const { data: examsData, isLoading: loadingExams } = useQuery({
        queryKey: ['cbt-exams'],
        queryFn: async () => {
            const res = await api.get('/cbt/exams');
            return res.data;
        }
    });

    // FETCH QUESTIONS
    const { data: questionsData, isLoading: loadingQuestions } = useQuery({
        queryKey: ['cbt-questions'],
        queryFn: async () => {
            const res = await api.get('/cbt/questions?limit=20');
            return res.data;
        },
        enabled: activeTab === 'questions'
    });

    // FETCH FLAGGED STUDENTS
    const { data: flaggedData } = useQuery({
        queryKey: ['flagged-students'],
        queryFn: async () => {
            const res = await api.get('/cbt/flagged');
            return res.data;
        },
        enabled: activeTab === 'flagged'
    });

    // FETCH SESSIONS
    const { data: sessionsData, isLoading: loadingSessions } = useQuery({
        queryKey: ['cbt-sessions', sessionExamFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (sessionExamFilter) params.append('exam_id', sessionExamFilter);
            const res = await api.get(`/cbt/sessions?${params}`);
            return res.data;
        },
        enabled: activeTab === 'sessions'
    });

    // OPEN SESSION MUTATION
    const openSessionMutation = useMutation({
        mutationFn: async (sessionId) => {
            const res = await api.patch(`/cbt/sessions/${sessionId}/open`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['cbt-exams']);
            queryClient.invalidateQueries(['cbt-sessions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // CLOSE SESSION MUTATION
    const closeSessionMutation = useMutation({
        mutationFn: async (sessionId) => {
            const res = await api.patch(`/cbt/sessions/${sessionId}/close`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['cbt-exams']);
            queryClient.invalidateQueries(['cbt-sessions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // DELETE SESSION MUTATION
    const deleteSessionMutation = useMutation({
        mutationFn: async (sessionId) => {
            const res = await api.delete(`/cbt/sessions/${sessionId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['cbt-sessions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // DELETE EXAM MUTATION
    const deleteExamMutation = useMutation({
        mutationFn: async (examId) => {
            const res = await api.delete(`/cbt/exams/${examId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['cbt-exams']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const exams = examsData?.data ?? [];
    const questions = questionsData?.data ?? [];
    const flagged = flaggedData?.data ?? [];
    const sessions = sessionsData?.data ?? [];

    const getSessionStatus = (session) => {
        const now = new Date();
        const datePart = session.scheduled_date.split('T')[0];
        const endDateTime = new Date(`${datePart}T${session.end_time}`);
        if (session.is_completed) return { label: 'Closed', color: 'bg-gray-100 text-gray-600' };
        if (endDateTime < now) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
        if (session.is_open) return { label: 'Open', color: 'bg-green-100 text-green-700' };
        return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700' };
    };

    const tabs = [
        { id: 'exams', label: 'Exams', icon: '📝' },
        { id: 'sessions', label: 'Sessions', icon: '🗂️' },
        { id: 'questions', label: 'Question Bank', icon: '❓' },
        { id: 'flagged', label: 'Flagged Students', icon: '🚩' },
    ];

    const examTypeColors = {
        ca: 'bg-blue-100 text-blue-700',
        exam: 'bg-purple-100 text-purple-700',
        mock: 'bg-green-100 text-green-700',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">CBT Management</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Create and manage computer based tests
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeTab === 'exams' && (
                        <button
                            onClick={() => setShowCreateExamModal(true)}
                            className="btn-primary text-sm"
                        >
                            ➕ Create Exam
                        </button>
                    )}
                    {activeTab === 'questions' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkImportModal(true)}
                                className="btn-secondary text-sm flex items-center gap-1"
                            >
                                📥 Bulk Import
                            </button>
                            <button
                                 onClick={() => setShowAddQuestionModal(true)}
                                className="btn-primary text-sm flex items-center gap-1"
                            >
                                ➕ Add Question
                            </button>
                        </div>
)}
                </div>
            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-1 bg-purple-50 p-1 rounded-xl w-fit">
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

            {/* EXAMS TAB */}
            {activeTab === 'exams' && (
                <div className="space-y-4">
                    {loadingExams ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="card text-center py-16">
                            <div className="text-5xl mb-3">📝</div>
                            <p className="text-purple-400 font-medium">No exams found</p>
                            <button
                                onClick={() => setShowCreateExamModal(true)}
                                className="btn-primary mt-4"
                            >
                                Create First Exam
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exams.map((exam) => (
                                <div key={exam.id}
                                    className="card hover:border-purple-300 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${
                                            examTypeColors[exam.exam_type]
                                        }`}>
                                            {exam.exam_type}
                                        </span>
                                        <span className="text-purple-400 text-xs">
                                            {exam.duration_minutes} mins
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-purple-900 mb-1 text-sm leading-tight"
                                        style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {exam.exam_title}
                                    </h3>
                                    <p className="text-purple-400 text-xs mb-3">
                                        {exam.subject_name} · {exam.class_name} · {exam.term_name}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-purple-500 mb-4">
                                        <span>📊 {exam.total_questions} questions</span>
                                        <span>🏆 Pass: {exam.pass_mark}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedExam(exam);
                                                setShowCreateSessionModal(true);
                                            }}
                                            className="py-2 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                                        >
                                            Schedule Session
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSessionExamFilter(exam.id);
                                                setActiveTab('sessions');
                                            }}
                                            className="py-2 text-xs font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                        >
                                            View Sessions
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Delete "${exam.exam_title}"? This cannot be undone.`)) {
                                                deleteExamMutation.mutate(exam.id);
                                            }
                                        }}
                                        className="w-full mt-2 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                    >
                                        🗑️ Delete Exam
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* QUESTIONS TAB */}
            {activeTab === 'questions' && (
                <div className="card p-0 overflow-hidden">
                    {loadingQuestions ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">❓</div>
                            <p className="text-purple-400 font-medium">No questions found</p>
                            <button
                                onClick={() => setShowAddQuestionModal(true)}
                                className="btn-primary mt-4"
                            >
                                Add First Question
                            </button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Question</th>
                                    <th>Subject</th>
                                    <th>Class</th>
                                    <th>Type</th>
                                    <th>Difficulty</th>
                                    <th>Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.map((question) => (
                                    <tr key={question.id}>
                                        <td>
                                            <p className="text-purple-900 text-sm max-w-xs truncate">
                                                {question.question_text}
                                            </p>
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {question.subject_name}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {question.class_name}
                                        </td>
                                        <td>
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full capitalize">
                                                {question.question_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                question.difficulty_level === 'easy'
                                                    ? 'bg-green-100 text-green-700'
                                                    : question.difficulty_level === 'medium'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {question.difficulty_level}
                                            </span>
                                        </td>
                                        <td className="text-purple-700 font-medium">
                                            {question.marks}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
                <div className="space-y-4">
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <select
                                value={sessionExamFilter}
                                onChange={(e) => setSessionExamFilter(e.target.value)}
                                className="input-field max-w-xs"
                            >
                                <option value="">All Exams</option>
                                {exams.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.exam_title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">🗂️</div>
                                <p className="text-purple-400 font-medium">
                                    No sessions found
                                </p>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Exam</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Venue</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session) => {
                                        const status = getSessionStatus(session);
                                        return (
                                            <tr key={session.id}>
                                                <td className="font-medium text-purple-900 text-sm">
                                                    {session.session_name}
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {session.exam_title}
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {new Date(session.scheduled_date).toLocaleDateString('en-NG')}
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {session.start_time} - {session.end_time}
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {session.venue || '—'}
                                                </td>
                                                <td>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => setViewingTokensSession(session)}
                                                            className="text-xs px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
                                                        >
                                                            🔑 Tokens
                                                        </button>
                                                        {!session.is_open && !session.is_completed && (
                                                            <button
                                                                onClick={() => openSessionMutation.mutate(session.id)}
                                                                className="text-xs px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                                            >
                                                                Open
                                                            </button>
                                                        )}
                                                        {session.is_open && !session.is_completed && (
                                                            <button
                                                                onClick={() => closeSessionMutation.mutate(session.id)}
                                                                className="text-xs px-2 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg font-medium transition-colors"
                                                            >
                                                                Close
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Delete this session? This cannot be undone.')) {
                                                                    deleteSessionMutation.mutate(session.id);
                                                                }
                                                            }}
                                                            className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* FLAGGED STUDENTS TAB */}
            {activeTab === 'flagged' && (
                <div className="card p-0 overflow-hidden">
                    {flagged.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">✅</div>
                            <p className="text-purple-400 font-medium">
                                No flagged students
                            </p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Exam</th>
                                    <th>Session</th>
                                    <th>Tab Switches</th>
                                    <th>Flag Reason</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flagged.map((result) => (
                                    <tr key={result.id}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-purple-900 text-sm">
                                                    {result.first_name} {result.last_name}
                                                </p>
                                                <p className="text-purple-400 text-xs">
                                                    {result.admission_number}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {result.exam_title}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {result.session_name}
                                        </td>
                                        <td>
                                            <span className="text-red-600 font-bold">
                                                {result.tab_switch_count}x
                                            </span>
                                        </td>
                                        <td className="text-red-500 text-sm">
                                            {result.flag_reason}
                                        </td>
                                        <td>
                                            <span className="font-bold text-purple-900">
                                                {result.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* MODALS */}
            {showAddQuestionModal && (
                <AddQuestionModal
                    onClose={() => setShowAddQuestionModal(false)}
                    onSuccess={() => {
                        setShowAddQuestionModal(false);
                        queryClient.invalidateQueries(['cbt-questions']);
                    }}
                />
            )}

            {showCreateExamModal && (
                <CreateExamModal
                    onClose={() => setShowCreateExamModal(false)}
                    onSuccess={() => {
                        setShowCreateExamModal(false);
                        queryClient.invalidateQueries(['cbt-exams']);
                    }}
                />
            )}

            {showBulkImportModal && (
                <BulkImportQuestionsModal
                    onClose={() => setShowBulkImportModal(false)}
                    onSuccess={() => {
                    setShowBulkImportModal(false);
                    queryClient.invalidateQueries(['cbt-questions']);
                    toast.success('Questions imported successfully.');
                    }}
                />
            )}

            {showCreateSessionModal && selectedExam && (
                <CreateCBTSessionModal
                    exam={selectedExam}
                    onClose={() => {
                        setShowCreateSessionModal(false);
                        setSelectedExam(null);
                    }}
                    onSuccess={() => {
                        setShowCreateSessionModal(false);
                        setSelectedExam(null);
                        queryClient.invalidateQueries(['cbt-exams']);
                        queryClient.invalidateQueries(['cbt-sessions']);
                    }}
                    onOpen={openSessionMutation.mutate}
                    onClose2={closeSessionMutation.mutate}
                />
            )}

            {viewingTokensSession && (
                <ViewTokensModal
                    session={viewingTokensSession}
                    onClose={() => setViewingTokensSession(null)}
                />
            )}
        </div>
    );
};


// ============================================
// ADD QUESTION MODAL
// ============================================
const AddQuestionModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        subject_id: '',
        class_id: '',
        question_text: '',
        question_type: 'multiple_choice',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: '',
        explanation: '',
        marks: 1,
        difficulty_level: 'medium'
    });

    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await api.get('/academic/subjects');
            return res.data;
        }
    });

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/cbt/questions', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            onSuccess();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.subject_id || !form.class_id || !form.question_text || !form.correct_option) {
            toast.error('Subject, class, question and correct option are required.');
            return;
        }
        mutation.mutate(form);
    };

    const subjects = subjectsData?.data ?? [];
    const classes = classesData?.data ?? [];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Add Question
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Subject <span className="text-red-500">*</span></label>
                            <select
                                value={form.subject_id}
                                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Class <span className="text-red-500">*</span></label>
                            <select
                                value={form.class_id}
                                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Question Type</label>
                        <select
                            value={form.question_type}
                            onChange={(e) => setForm({ ...form, question_type: e.target.value })}
                            className="input-field"
                        >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Question <span className="text-red-500">*</span></label>
                        <textarea
                            value={form.question_text}
                            onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                            className="input-field min-h-20"
                            placeholder="Enter your question here"
                            rows={3}
                        />
                    </div>

                    {form.question_type === 'multiple_choice' && (
                        <div className="grid grid-cols-2 gap-3">
                            {['a', 'b', 'c', 'd'].map((opt) => (
                                <div key={opt} className="form-group">
                                    <label className="form-label">Option {opt.toUpperCase()}</label>
                                    <input
                                        value={form[`option_${opt}`]}
                                        onChange={(e) => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                                        className="input-field"
                                        placeholder={`Option ${opt.toUpperCase()}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label">Correct Answer <span className="text-red-500">*</span></label>
                            <select
                                value={form.correct_option}
                                onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select</option>
                                {form.question_type === 'multiple_choice' ? (
                                    ['a', 'b', 'c', 'd'].map((opt) => (
                                        <option key={opt} value={opt}>Option {opt.toUpperCase()}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Difficulty</label>
                            <select
                                value={form.difficulty_level}
                                onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                                className="input-field"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Marks</label>
                            <input
                                type="number"
                                min="1"
                                value={form.marks}
                                onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Explanation (Optional)</label>
                        <input
                            value={form.explanation}
                            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                            className="input-field"
                            placeholder="Why is this the correct answer?"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Add Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ============================================
// CREATE EXAM MODAL
// ============================================
const CreateExamModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        exam_title: '',
        subject_id: '',
        class_id: '',
        session_id: '',
        term_id: '',
        exam_type: 'ca',
        total_questions: 40,
        total_marks: 40,
        duration_minutes: 60,
        pass_mark: 40,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        allow_review: true,
        instructions: ''
    });

    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await api.get('/academic/subjects');
            return res.data;
        }
    });

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/cbt/exams', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            onSuccess();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.exam_title || !form.subject_id || !form.class_id || !form.session_id || !form.term_id) {
            toast.error('All required fields must be filled.');
            return;
        }
        mutation.mutate(form);
    };

    const subjects = subjectsData?.data ?? [];
    const classes = classesData?.data ?? [];
    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Create CBT Exam
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Exam Title <span className="text-red-500">*</span></label>
                        <input
                            value={form.exam_title}
                            onChange={(e) => setForm({ ...form, exam_title: e.target.value })}
                            className="input-field"
                            placeholder="e.g., JSS1 Mathematics First Term CA1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Subject <span className="text-red-500">*</span></label>
                            <select
                                value={form.subject_id}
                                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Class <span className="text-red-500">*</span></label>
                            <select
                                value={form.class_id}
                                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Session <span className="text-red-500">*</span></label>
                            <select
                                value={form.session_id}
                                onChange={(e) => setForm({ ...form, session_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select session</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Term <span className="text-red-500">*</span></label>
                            <select
                                value={form.term_id}
                                onChange={(e) => setForm({ ...form, term_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select term</option>
                                {terms.map((t) => (
                                    <option key={t.id} value={t.id}>{t.term_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Exam Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'ca', label: 'CA Test' },
                                { value: 'exam', label: 'Examination' },
                                { value: 'mock', label: 'Mock Exam' },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, exam_type: type.value })}
                                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                                        form.exam_type === type.value
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="form-group">
                            <label className="form-label">Questions</label>
                            <input
                                type="number"
                                value={form.total_questions}
                                onChange={(e) => setForm({ ...form, total_questions: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Marks</label>
                            <input
                                type="number"
                                value={form.total_marks}
                                onChange={(e) => setForm({ ...form, total_marks: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                    
                    <div className="form-group">
                        <label className="form-label">
                            Exam Duration <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <select
                                    value={Math.floor(form.duration_minutes / 60)}
                                    onChange={(e) => {
                                        const hours = parseInt(e.target.value);
                                        const mins = form.duration_minutes % 60;
                                        setForm({
                                            ...form,
                                            duration_minutes: (hours * 60) + mins
                                        });
                                    }}
                                    className="input-field"
                                >
                                    {[0,1,2,3,4,5].map(h => (
                                        <option key={h} value={h}>
                                            {h} {h === 1 ? 'hour' : 'hours'}
                                        </option>
                                    ))}
                                </select>
                    </div>
                    <div>
                        <select
                            value={form.duration_minutes % 60}
                            onChange={(e) => {
                                const mins = parseInt(e.target.value);
                                const hours = Math.floor(form.duration_minutes / 60);
                                setForm({
                                    ...form,
                                    duration_minutes: (hours * 60) + mins
                                });
                            }}
                            className="input-field"
                        >
                            {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                                <option key={m} value={m}>
                                    {m} {m === 1 ? 'minute' : 'minutes'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="text-purple-400 text-xs mt-1">
                    Total: {Math.floor(form.duration_minutes / 60) > 0
                        ? `${Math.floor(form.duration_minutes / 60)}h `
                        : ''
                    }{form.duration_minutes % 60 > 0
                        ? `${form.duration_minutes % 60}mins`
                        : ''
                    } ({form.duration_minutes} minutes total)
                </p>
            </div>
            
                        <div className="form-group">
                            <label className="form-label">Pass Mark</label>
                            <input
                                type="number"
                                value={form.pass_mark}
                                onChange={(e) => setForm({ ...form, pass_mark: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'shuffle_questions', label: 'Shuffle Questions' },
                            { key: 'shuffle_options', label: 'Shuffle Options' },
                            { key: 'show_result_immediately', label: 'Show Result Immediately' },
                            { key: 'allow_review', label: 'Allow Review Before Submit' },
                        ].map((opt) => (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form[opt.key]}
                                    onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                                    className="w-4 h-4 accent-purple-600"
                                />
                                <span className="text-purple-700 text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Instructions</label>
                        <textarea
                            value={form.instructions}
                            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Instructions shown to students before exam starts"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Creating...' : 'Create Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ============================================
// CREATE CBT SESSION MODAL
// ============================================
const CreateCBTSessionModal = ({ exam, onClose, onSuccess, onOpen, onClose2 }) => {
    const [form, setForm] = useState({
        session_name: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        venue: '',
        max_students: ''
    });
    const [createdSession, setCreatedSession] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [generatingTokens, setGeneratingTokens] = useState(false);
    const [loadingTokens, setLoadingTokens] = useState(false);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/cbt/sessions', {
                exam_id: exam.id,
                ...data
            });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setCreatedSession(data.data);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.session_name || !form.scheduled_date || !form.start_time || !form.end_time) {
            toast.error('Session name, date and times are required.');
            return;
        }
        mutation.mutate({
            ...form,
            max_students: form.max_students ? parseInt(form.max_students) : null
        });
    };

    // GENERATE TOKENS FOR ALL STUDENTS IN THE CLASS
    const handleGenerateTokens = async () => {
        setGeneratingTokens(true);
        try {
            const res = await api.post(
                `/cbt-tokens/sessions/${createdSession.id}/generate-tokens`
            );
            if (res.data.success) {
                toast.success(res.data.message);
                setTokens(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate tokens.');
        } finally {
            setGeneratingTokens(false);
        }
    };

    // FETCH EXISTING TOKENS IF ALREADY GENERATED
    const handleFetchTokens = async () => {
        setLoadingTokens(true);
        try {
            const res = await api.get(
                `/cbt-tokens/sessions/${createdSession.id}/tokens`
            );
            if (res.data.success) {
                setTokens(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch tokens.');
        } finally {
            setLoadingTokens(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Schedule Session
                        </h2>
                        <p className="text-purple-400 text-sm">{exam.exam_title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>

                {/* STEP 1 — CREATE SESSION FORM */}
                {!createdSession ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="form-group">
                            <label className="form-label">Session Name <span className="text-red-500">*</span></label>
                            <input
                                value={form.session_name}
                                onChange={(e) => setForm({ ...form, session_name: e.target.value })}
                                className="input-field"
                                placeholder="e.g., Batch A"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.scheduled_date}
                                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Start Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    value={form.start_time}
                                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    value={form.end_time}
                                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Venue</label>
                                <input
                                    value={form.venue}
                                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Computer Lab 1"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Students</label>
                                <input
                                    type="number"
                                    value={form.max_students}
                                    onChange={(e) => setForm({ ...form, max_students: e.target.value })}
                                    className="input-field"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={mutation.isPending} className="btn-primary">
                                {mutation.isPending ? 'Creating...' : 'Create Session'}
                            </button>
                        </div>
                    </form>

                ) : (
                    // STEP 2 — SESSION CREATED, SHOW OPTIONS AND TOKENS
                    <div className="p-6 space-y-4">

                        {/* SUCCESS BANNER */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                            <div className="text-3xl mb-1">✅</div>
                            <p className="font-semibold text-green-800">Session Created</p>
                            <p className="text-green-600 text-sm">{createdSession.session_name}</p>
                        </div>

                        {/* OPEN / OPEN LATER BUTTONS */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    onOpen(createdSession.id);
                                    onSuccess();
                                }}
                                className="py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all text-sm"
                            >
                                🟢 Open Now
                            </button>
                            <button
                                onClick={onSuccess}
                                className="btn-secondary py-3"
                            >
                                Open Later
                            </button>
                        </div>

                        {/* DIVIDER */}
                        <div className="border-t border-purple-100 pt-4">
                            <p className="text-purple-700 font-semibold text-sm mb-3">
                                📋 Student Exam Tokens
                            </p>

                            {/* GENERATE / FETCH BUTTONS */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={handleGenerateTokens}
                                    disabled={generatingTokens}
                                    className="btn-primary text-sm flex-1"
                                >
                                    {generatingTokens ? 'Generating...' : '🔑 Generate Tokens'}
                                </button>
                                {tokens.length === 0 && (
                                    <button
                                        onClick={handleFetchTokens}
                                        disabled={loadingTokens}
                                        className="btn-secondary text-sm"
                                    >
                                        {loadingTokens ? 'Loading...' : '🔄 Fetch Existing'}
                                    </button>
                                )}
                            </div>

                            {/* TOKEN LIST */}
                            {tokens.length > 0 && (
                                <div className="border border-purple-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-purple-50">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Student</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Adm. No</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Token</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tokens.map((t, idx) => (
                                                <tr key={idx} className="border-t border-purple-50">
                                                    <td className="px-4 py-2 text-purple-900 font-medium">
                                                        {t.last_name} {t.first_name}
                                                    </td>
                                                    <td className="px-4 py-2 text-purple-500 text-xs">
                                                        {t.admission_number}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className="bg-purple-100 text-purple-800 font-bold text-xs px-2 py-1 rounded-lg tracking-wide">
                                                            {t.access_token}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                            t.is_used
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {t.is_used ? 'Used' : 'Unused'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {tokens.length === 0 && !generatingTokens && (
                                <div className="text-center py-6 text-purple-300 text-sm">
                                    No tokens yet. Click Generate Tokens to create them.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// VIEW TOKENS MODAL
// ============================================
const ViewTokensModal = ({ session, onClose }) => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const fetchTokens = async () => {
        setLoading(true);
        try {
            const res = await api.get(
                `/cbt-tokens/sessions/${session.id}/tokens`
            );
            if (res.data.success) {
                setTokens(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch tokens.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, [session.id]);

    const handleGenerateTokens = async () => {
        setGenerating(true);
        try {
            const res = await api.post(
                `/cbt-tokens/sessions/${session.id}/generate-tokens`
            );
            if (res.data.success) {
                toast.success(res.data.message);
                setTokens(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate tokens.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Student Exam Tokens
                        </h2>
                        <p className="text-purple-400 text-sm">
                            {session.session_name} · {session.exam_title}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleGenerateTokens}
                                    disabled={generating}
                                    className="btn-primary text-sm"
                                >
                                    {generating
                                        ? 'Generating...'
                                        : tokens.length > 0
                                            ? '🔄 Regenerate / Fetch Tokens'
                                            : '🔑 Generate Tokens'}
                                </button>
                            </div>

                            {tokens.length > 0 ? (
                                <div className="border border-purple-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-purple-50">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Student</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Adm. No</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Token</th>
                                                <th className="text-left px-4 py-2 text-purple-700 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tokens.map((t, idx) => (
                                                <tr key={idx} className="border-t border-purple-50">
                                                    <td className="px-4 py-2 text-purple-900 font-medium">
                                                        {t.last_name} {t.first_name}
                                                    </td>
                                                    <td className="px-4 py-2 text-purple-500 text-xs">
                                                        {t.admission_number}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className="bg-purple-100 text-purple-800 font-bold text-xs px-2 py-1 rounded-lg tracking-wide">
                                                            {t.access_token}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                            t.is_used
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {t.is_used ? 'Used' : 'Unused'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-purple-300 text-sm">
                                    No tokens yet. Click Generate Tokens to create them.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CBTPage;