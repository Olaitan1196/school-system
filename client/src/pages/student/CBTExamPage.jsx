import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CBTExamPage = () => {
    const navigate = useNavigate();
    const [examData, setExamData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ============================================
    // LOAD EXAM DATA FROM SESSION STORAGE
    // ============================================
    useEffect(() => {
        const stored = sessionStorage.getItem('cbt_exam_data');
        if (!stored) {
            navigate('/cbt');
            return;
        }
        const data = JSON.parse(stored);
        setExamData(data);
        setTimeLeft(data.duration_minutes * 60);
    }, [navigate]);

    // ============================================
    // SUBMIT EXAM
    // ============================================
    const submitExam = useCallback(async (type = 'manual') => {
        if (!examData || submitting) return;
        setSubmitting(true);

        try {
            const res = await api.post(
                `/cbt/sessions/${examData.session_id}/submit`,
                {
                    answers,
                    submission_type: type,
                    student_id: examData.student_id
                }
            );

            if (res.data.success) {
                sessionStorage.removeItem('cbt_exam_data');
                setResult(res.data.data);
                setSubmitted(true);
                setShowSubmitModal(false);
            }
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    }, [examData, answers, submitting]);

    // ============================================
    // COUNTDOWN TIMER
    // ============================================
    useEffect(() => {
        if (!examData || submitted) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    submitExam('auto');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [examData, submitted, submitExam]);

    // ============================================
    // TAB SWITCH DETECTION
    // ============================================
    useEffect(() => {
        if (!examData || submitted) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                try {
                    const res = await api.post(
                        `/cbt/sessions/${examData.session_id}/tab-switch`,
                        { student_id: examData.student_id }
                    );
                    if (res.data.auto_submitted) {
                        sessionStorage.removeItem('cbt_exam_data');
                        setResult({ auto_submitted: true, is_flagged: true });
                        setSubmitted(true);
                    }
                } catch (error) {
                    console.error('Tab switch error:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [examData, submitted]);

    // ============================================
    // FORMAT TIMER
    // ============================================
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isWarning = timeLeft <= 300; // last 5 minutes

    if (!examData) return null;

    const questions = examData.questions;
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;
    const progress = (answeredCount / questions.length) * 100;

    // ============================================
    // RESULT SCREEN
    // ============================================
    if (submitted && result) {
        const passed = parseFloat(result.percentage) >= 50;

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">

                    <div className="text-5xl mb-4">
                        {result.auto_submitted ? '🚨' : passed ? '🎉' : '📋'}
                    </div>

                    {result.auto_submitted ? (
                        <>
                            <h2 className="text-xl font-bold text-red-700 mb-2">
                                Exam Auto-Submitted
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Your exam was automatically submitted and flagged due to repeated tab switching.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-purple-900 mb-1"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {passed ? 'Well Done!' : 'Exam Completed'}
                            </h2>
                            <p className="text-purple-400 text-sm mb-6">
                                {examData.exam_title}
                            </p>

                            {/* SCORE CIRCLE */}
                            <div className="w-32 h-32 rounded-full bg-purple-50 border-4 border-purple-200 flex flex-col items-center justify-center mx-auto mb-6">
                                <span className="text-3xl font-black text-purple-700">
                                    {result.percentage}%
                                </span>
                                <span className="text-xs text-purple-400 uppercase tracking-wide">
                                    Score
                                </span>
                            </div>

                            {/* STATS */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-green-50 rounded-xl p-3">
                                    <div className="text-2xl font-black text-green-600">
                                        {result.correct_answers}
                                    </div>
                                    <div className="text-xs text-green-500 uppercase tracking-wide">
                                        Correct
                                    </div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3">
                                    <div className="text-2xl font-black text-red-500">
                                        {result.wrong_answers}
                                    </div>
                                    <div className="text-xs text-red-400 uppercase tracking-wide">
                                        Wrong
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="text-2xl font-black text-gray-500">
                                        {result.skipped_answers}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                                        Skipped
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-3 mb-6">
                                <p className="text-purple-600 text-sm">
                                    Score: <strong>{result.score_obtained}</strong> / {examData.total_marks} marks
                                </p>
                                <p className="text-purple-400 text-xs mt-1">
                                    Time taken: {result.time_taken_minutes} minutes
                                </p>
                            </div>
                        </>
                    )}

                    <p className="text-gray-400 text-xs">
                        You may close this window now.
                    </p>
                </div>
            </div>
        );
    }

    // ============================================
    // EXAM SCREEN
    // ============================================
    return (
        <div className="min-h-screen bg-[#f8f7ff] flex flex-col">

            {/* HEADER */}
            <div className="bg-purple-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div>
                    <p className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {examData.exam_title}
                    </p>
                    <p className="text-purple-300 text-xs">{examData.student_name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-purple-300 text-xs hidden sm:block">
                        {answeredCount}/{questions.length} answered
                    </span>
                    <div className={`font-black text-lg px-4 py-1 rounded-full ${
                        isWarning
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-white text-purple-800'
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-1 bg-purple-100">
                <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* BODY */}
            <div className="flex flex-1">

                {/* QUESTION PANEL */}
                <div className="flex-1 p-6 sm:p-10 max-w-3xl mx-auto w-full">

                    {/* QUESTION NUMBER */}
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">
                        Question {currentIndex + 1} of {questions.length}
                    </p>

                    {/* QUESTION TEXT */}
                    <p className="text-lg sm:text-xl font-semibold text-purple-900 leading-relaxed mb-8">
                        {currentQuestion.question_text}
                    </p>

                    {/* OPTIONS */}
                    <div className="space-y-3 mb-10">
                        {['a', 'b', 'c', 'd'].map((letter) => {
                            const optionText = currentQuestion[`option_${letter}`];
                            if (!optionText) return null;
                            const isSelected = answers[currentQuestion.id] === letter;

                            return (
                                <button
                                    key={letter}
                                    onClick={() => setAnswers(prev => ({
                                        ...prev,
                                        [currentQuestion.id]: letter
                                    }))}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                        isSelected
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-purple-100 bg-white hover:border-purple-300'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${
                                        isSelected
                                            ? 'bg-purple-700 border-purple-700 text-white'
                                            : 'border-purple-200 text-purple-600'
                                    }`}>
                                        {letter.toUpperCase()}
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">
                                        {optionText}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* NAVIGATION */}
                    <div className="flex items-center justify-between border-t border-purple-100 pt-6">
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-6 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold text-sm hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-all"
                            >
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="px-6 py-2.5 rounded-xl bg-purple-700 text-white font-semibold text-sm hover:bg-purple-800 transition-all"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>

                {/* SIDEBAR — QUESTION GRID */}
                <div className="hidden lg:block w-56 bg-white border-l border-purple-100 p-4 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">
                        Questions
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                    idx === currentIndex
                                        ? 'border-2 border-purple-600 text-purple-700'
                                        : answers[q.id]
                                            ? 'bg-purple-700 text-white'
                                            : 'border border-purple-100 text-gray-500'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* LEGEND */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-4 h-4 rounded bg-purple-700" />
                            Answered
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-4 h-4 rounded border border-purple-100" />
                            Unanswered
                        </div>
                    </div>
                </div>
            </div>

            {/* SUBMIT MODAL */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="text-5xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                            Submit Exam?
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            You have answered {answeredCount} out of {questions.length} questions.
                            {unansweredCount > 0 && (
                                <span className="text-red-500 font-semibold">
                                    {' '}{unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered.
                                </span>
                            )}
                        </p>

                        {/* STATS */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-purple-50 rounded-xl p-3">
                                <div className="text-xl font-black text-purple-700">{answeredCount}</div>
                                <div className="text-xs text-purple-400">Answered</div>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3">
                                <div className="text-xl font-black text-red-500">{unansweredCount}</div>
                                <div className="text-xs text-red-400">Skipped</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xl font-black text-gray-600">{questions.length}</div>
                                <div className="text-xs text-gray-400">Total</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold text-sm hover:border-purple-500 transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => submitExam('manual')}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {submitting ? 'Submitting...' : 'Submit Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CBTExamPage;