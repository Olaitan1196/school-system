import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PublicExamPage = () => {
    const navigate = useNavigate();
    const [accessInfo, setAccessInfo] = useState(null);
    const [step, setStep] = useState(1);
    const [examConfig, setExamConfig] = useState({
        exam_body: '',
        subject_name: '',
        total_questions: 40
    });
    const [examData, setExamData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(3600);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const timerRef = useRef(null);

    // CHECK ACCESS ON LOAD
    useEffect(() => {
        const access = sessionStorage.getItem('exam_access');
        if (access) {
            setAccessInfo(JSON.parse(access));
        } else {
            navigate('/exam-access');
        }
    }, [navigate]);

    // COUNTDOWN TIMER
    useEffect(() => {
        if (examStarted && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [examStarted]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const subjectsByExamBody = {
        WAEC: ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Geography', 'Economics', 'Government', 'Literature', 'Commerce', 'Accounting'],
        UTME: ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Geography', 'Economics', 'Government', 'Literature', 'Commerce', 'Accounting', 'Agricultural Science'],
        NECO: ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Geography', 'Economics', 'Government', 'Literature', 'Commerce'],
        BECE: ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Basic Technology', 'Agricultural Science', 'Home Economics', 'Computer Studies'],
    };

    const handleStartExam = async () => {
        if (!examConfig.exam_body || !examConfig.subject_name) {
            toast.error('Please select exam body and subject.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/cbt/public/start', {
                ...examConfig,
                candidate_name: accessInfo?.name
            });
            setExamData(res.data.data);
            setAnswers({});
            setCurrentQuestion(0);
            setTimeLeft(examConfig.total_questions * 90);
            setExamStarted(true);
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'No questions found for this selection.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async (autoSubmit = false) => {
        clearInterval(timerRef.current);
        setExamStarted(false);
        setLoading(true);
        try {
            const timeTaken = Math.round((examConfig.total_questions * 90 - timeLeft) / 60);
            const res = await api.post('/cbt/public/submit', {
                attempt_reference: examData.attempt_reference,
                answers,
                time_taken_minutes: timeTaken
            });
            setResult(res.data.data);
            setStep(4);
            if (autoSubmit) {
                toast('Time up! Exam auto submitted.', { icon: '⏰' });
            }
        } catch (error) {
            toast.error('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!accessInfo) return null;

    return (
        <div className="min-h-screen bg-[#f8f7ff]">

            {/* NAVBAR */}
            {step !== 3 && (
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
                    <div className="flex items-center gap-3">
                        <span className="text-purple-400 text-sm">
                            Welcome, {accessInfo.name}
                        </span>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('exam_access');
                                navigate('/');
                            }}
                            className="text-purple-500 hover:text-purple-700 text-sm transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </nav>
            )}

            {/* STEP 1: WELCOME */}
            {step === 1 && (
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <div className="text-6xl mb-6">📚</div>
                    <h1 className="text-3xl font-bold text-purple-950 mb-3"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Practice Exam Portal
                    </h1>
                    <p className="text-purple-400 mb-2">
                        Welcome, <span className="font-semibold text-purple-700">{accessInfo.name}</span>
                    </p>
                    <p className="text-purple-400 text-sm mb-8">
                        Practice WAEC, UTME, NECO and BECE past questions
                        to prepare for your examinations.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        {[
                            { body: 'WAEC', icon: '📗', desc: 'West African Examinations Council' },
                            { body: 'UTME', icon: '🎓', desc: 'Unified Tertiary Matriculation Exam' },
                            { body: 'NECO', icon: '📘', desc: 'National Examinations Council' },
                            { body: 'BECE', icon: '📙', desc: 'Basic Education Certificate Exam' },
                        ].map((exam) => (
                            <button
                                key={exam.body}
                                onClick={() => {
                                    setExamConfig({ ...examConfig, exam_body: exam.body });
                                    setStep(2);
                                }}
                                className="card hover:border-purple-300 hover:shadow-md transition-all text-left"
                            >
                                <div className="text-3xl mb-2">{exam.icon}</div>
                                <h3 className="font-bold text-purple-900"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {exam.body}
                                </h3>
                                <p className="text-purple-400 text-xs">{exam.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: SELECT SUBJECT */}
            {step === 2 && (
                <div className="max-w-lg mx-auto px-4 py-16">
                    <button
                        onClick={() => setStep(1)}
                        className="text-purple-500 hover:text-purple-700 text-sm mb-6 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-purple-950 mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {examConfig.exam_body} Practice
                    </h2>
                    <p className="text-purple-400 text-sm mb-6">
                        Select a subject and number of questions
                    </p>

                    <div className="card space-y-4">
                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <select
                                value={examConfig.subject_name}
                                onChange={(e) => setExamConfig({ ...examConfig, subject_name: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select subject</option>
                                {(subjectsByExamBody[examConfig.exam_body] || []).map((subject) => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Number of Questions</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[20, 30, 40, 50].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setExamConfig({ ...examConfig, total_questions: num })}
                                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            examConfig.total_questions === num
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <p className="text-purple-600 text-sm">
                                ⏱ Time: ~{Math.round(examConfig.total_questions * 1.5)} minutes
                            </p>
                        </div>

                        <button
                            onClick={handleStartExam}
                            disabled={loading || !examConfig.subject_name}
                            className="btn-primary w-full py-3"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Loading questions...
                                </span>
                            ) : (
                                '🚀 Start Exam'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: EXAM */}
            {step === 3 && examData && (
                <div className="min-h-screen bg-purple-950">

                    {/* EXAM TOPBAR */}
                    <div className="bg-purple-900 border-b border-purple-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <p className="text-white font-semibold text-sm">
                                {examConfig.exam_body} · {examConfig.subject_name}
                            </p>
                            <p className="text-purple-300 text-xs">
                                Question {currentQuestion + 1} of {examData.questions.length}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                                timeLeft < 300
                                    ? 'bg-red-500/20 text-red-300'
                                    : timeLeft < 600
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-white/10 text-white'
                            }`}>
                                ⏱ {formatTime(timeLeft)}
                            </div>
                            <button
                                onClick={() => {
                                    if (window.confirm('Submit exam now?')) {
                                        handleSubmit();
                                    }
                                }}
                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto px-4 py-8">

                        {/* QUESTION */}
                        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
                            <p className="text-purple-400 text-xs font-medium mb-3 uppercase tracking-wider">
                                Question {currentQuestion + 1}
                            </p>
                            <p className="text-purple-950 font-medium text-base leading-relaxed mb-6">
                                {examData.questions[currentQuestion].question_text}
                            </p>

                            {/* OPTIONS */}
                            <div className="space-y-3">
                                {examData.questions[currentQuestion].question_type === 'multiple_choice' ? (
                                    ['a', 'b', 'c', 'd'].map((opt) => {
                                        const optionText = examData.questions[currentQuestion][`option_${opt}`];
                                        if (!optionText) return null;
                                        const isSelected = answers[examData.questions[currentQuestion].id] === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleAnswer(examData.questions[currentQuestion].id, opt)}
                                                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {opt.toUpperCase()}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                                                    {optionText}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    ['true', 'false'].map((opt) => {
                                        const isSelected = answers[examData.questions[currentQuestion].id] === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleAnswer(examData.questions[currentQuestion].id, opt)}
                                                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all capitalize ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {opt === 'true' ? 'T' : 'F'}
                                                </div>
                                                <span className={`text-sm font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestion === 0}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl disabled:opacity-40 transition-all text-sm"
                            >
                                ← Previous
                            </button>

                            {/* QUESTION NAVIGATOR */}
                            <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                                {examData.questions.slice(0, 10).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentQuestion(i)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                            currentQuestion === i
                                                ? 'bg-purple-500 text-white'
                                                : answers[q.id]
                                                ? 'bg-green-500/70 text-white'
                                                : 'bg-white/10 text-white'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                {examData.questions.length > 10 && (
                                    <span className="text-purple-300 text-xs self-center">
                                        +{examData.questions.length - 10} more
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => setCurrentQuestion(prev => Math.min(examData.questions.length - 1, prev + 1))}
                                disabled={currentQuestion === examData.questions.length - 1}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl disabled:opacity-40 transition-all text-sm"
                            >
                                Next →
                            </button>
                        </div>

                        {/* ANSWERED COUNT */}
                        <div className="text-center mt-4">
                            <p className="text-purple-300 text-sm">
                                {Object.keys(answers).length} of {examData.questions.length} questions answered
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 4 && result && (
                <div className="max-w-2xl mx-auto px-4 py-16">
                    <div className="card text-center mb-6">
                        <div className="text-6xl mb-4">
                            {result.percentage >= 70 ? '🎉' : result.percentage >= 50 ? '👍' : '📚'}
                        </div>
                        <h2 className="text-3xl font-bold text-purple-950 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            {result.percentage >= 70 ? 'Excellent!' : result.percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
                        </h2>
                        <p className="text-purple-400 mb-6">
                            {examConfig.exam_body} · {examConfig.subject_name}
                        </p>

                        <div className="text-6xl font-bold text-purple-700 mb-2"
                             style={{ fontFamily: "'Playfair Display', serif" }}>
                            {result.percentage}%
                        </div>
                        <p className="text-purple-400 text-sm mb-6">
                            {result.score_obtained} out of {result.total_questions} correct
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Correct', value: result.correct_answers, color: 'bg-green-50 text-green-700' },
                                { label: 'Wrong', value: result.wrong_answers, color: 'bg-red-50 text-red-700' },
                                { label: 'Skipped', value: result.skipped_answers, color: 'bg-gray-50 text-gray-700' },
                            ].map((stat) => (
                                <div key={stat.label} className={`${stat.color} rounded-xl p-3`}>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setStep(2);
                                    setResult(null);
                                    setExamData(null);
                                    setAnswers({});
                                }}
                                className="btn-primary"
                            >
                                🔄 Practice Again
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                className="btn-secondary"
                            >
                                Choose Different Subject
                            </button>
                        </div>
                    </div>

                    {/* REVIEW */}
                    <div className="card p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="section-title">Answer Review</h3>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {result.review.map((item, index) => (
                                <div key={item.question_id}
                                    className={`p-4 ${item.is_correct ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                                    <div className="flex items-start gap-3">
                                        <span className={`text-lg flex-shrink-0 mt-0.5 ${
                                            item.is_correct ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {item.is_correct ? '✅' : '❌'}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-purple-900 text-sm font-medium mb-2">
                                                {index + 1}. {item.question_text}
                                            </p>
                                            <div className="flex flex-wrap gap-3 text-xs">
                                                <span className={`px-2 py-1 rounded-full font-medium ${
                                                    item.is_correct
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    Your answer: {item.your_answer?.toUpperCase() || 'Skipped'}
                                                </span>
                                                {!item.is_correct && (
                                                    <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                                                        Correct: {item.correct_answer.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            {item.explanation && (
                                                <p className="text-purple-500 text-xs mt-2 italic">
                                                    💡 {item.explanation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicExamPage;