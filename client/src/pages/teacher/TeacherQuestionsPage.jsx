import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BulkImportQuestionsModal from '../../components/admin/BulkImportQuestionsModal';

const TeacherQuestionsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
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

    // FETCH MY ASSIGNMENTS TO GET MY SUBJECTS AND CLASSES
    const { data: teacherData } = useQuery({
        queryKey: ['teacher-detail', user?.teacher_id],
        queryFn: async () => {
            const res = await api.get(`/teachers/${user.teacher_id}`);
            return res.data;
        },
        enabled: !!user?.teacher_id
    });

    // FETCH MY QUESTIONS
    const { data: questionsData, isLoading } = useQuery({
        queryKey: ['my-questions', subjectFilter, classFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (subjectFilter) params.append('subject_id', subjectFilter);
            if (classFilter) params.append('class_id', classFilter);
            params.append('limit', 30);
            const res = await api.get(`/cbt/questions?${params}`);
            return res.data;
        }
    });

    // ADD QUESTION MUTATION
    const addMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/cbt/questions', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setShowAddModal(false);
            setForm({
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
            queryClient.invalidateQueries(['my-questions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const assignments = teacherData?.data?.assignments ?? [];
    const mySubjects = [...new Map(
        assignments.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])
    ).values()];
    const myClasses = [...new Map(
        assignments.map(a => [a.class_id, { id: a.class_id, name: a.class_name }])
    ).values()];
    const questions = questionsData?.data ?? [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.subject_id || !form.class_id || !form.question_text || !form.correct_option) {
            toast.error('Subject, class, question and correct option are required.');
            return;
        }
        addMutation.mutate(form);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">CBT Questions</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Add questions to the question bank
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="btn-secondary text-sm flex items-center gap-1"
                    >
                        📥 Bulk Import
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary text-sm flex items-center gap-1"
                    >
                        ➕ Add Question
                    </button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="card">
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All My Subjects</option>
                        {mySubjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All My Classes</option>
                        {myClasses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* QUESTIONS TABLE */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">❓</div>
                        <p className="text-purple-400 font-medium">No questions found</p>
                        <button
                            onClick={() => setShowAddModal(true)}
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
                            {questions.map((q) => (
                                <tr key={q.id}>
                                    <td>
                                        <p className="text-purple-900 text-sm max-w-xs truncate">
                                            {q.question_text}
                                        </p>
                                    </td>
                                    <td className="text-purple-600 text-sm">{q.subject_name}</td>
                                    <td className="text-purple-600 text-sm">{q.class_name}</td>
                                    <td>
                                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full capitalize">
                                            {q.question_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                            q.difficulty_level === 'easy'
                                                ? 'bg-green-100 text-green-700'
                                                : q.difficulty_level === 'medium'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {q.difficulty_level}
                                        </span>
                                    </td>
                                    <td className="text-purple-700 font-medium">{q.marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ADD QUESTION MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-purple-950"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                Add Question
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                            >
                                ✕
                            </button>
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
                                        {mySubjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
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
                                        {myClasses.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
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
                                    className="input-field"
                                    rows={3}
                                    placeholder="Enter your question"
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
                                <label className="form-label">Explanation</label>
                                <input
                                    value={form.explanation}
                                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                                    className="input-field"
                                    placeholder="Why is this the correct answer?"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={addMutation.isPending} className="btn-primary">
                                    {addMutation.isPending ? 'Saving...' : 'Add Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BULK IMPORT MODAL */}
            {showBulkModal && (
                <BulkImportQuestionsModal
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => {
                        setShowBulkModal(false);
                        queryClient.invalidateQueries(['my-questions']);
                    }}
                />
            )}
        </div>
    );
};

export default TeacherQuestionsPage;