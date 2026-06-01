import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PromotionsPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('settings');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedNextSession, setSelectedNextSession] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [searching, setSearching] = useState(false);

    // FETCH SESSIONS
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    // FETCH PROMOTION SETTINGS
    const { data: settingsData } = useQuery({
        queryKey: ['promotion-settings'],
        queryFn: async () => {
            const res = await api.get('/promotions/settings');
            return res.data;
        }
    });

    // FETCH CLASS PROMOTIONS
    const { data: classPromotionsData } = useQuery({
        queryKey: ['class-promotions', selectedClass, selectedSession],
        queryFn: async () => {
            const res = await api.get(
                `/promotions/class?class_id=${selectedClass}&session_id=${selectedSession}`
            );
            return res.data;
        },
        enabled: !!(selectedClass && selectedSession) && activeTab === 'results'
    });

    // FETCH PROMOTION SUMMARY
    const { data: summaryData } = useQuery({
        queryKey: ['promotion-summary', selectedSession],
        queryFn: async () => {
            const res = await api.get(`/promotions/summary/${selectedSession}`);
            return res.data;
        },
        enabled: !!selectedSession && activeTab === 'results'
    });

    // SET PROMOTION SETTINGS
    const [settingsForm, setSettingsForm] = useState({
        session_id: '',
        pass_percentage: ''
    });

    const setSettingsMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/promotions/settings', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['promotion-settings']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // RUN AUTO PROMOTION
    const autoPromotionMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/promotions/auto', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['class-promotions']);
            queryClient.invalidateQueries(['promotion-summary']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // MANUAL PROMOTION
    const manualPromotionMutation = useMutation({
        mutationFn: async ({ studentId, data }) => {
            const res = await api.patch(`/promotions/students/${studentId}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setShowManualModal(false);
            setFoundStudent(null);
            setStudentSearch('');
            queryClient.invalidateQueries(['class-promotions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const searchStudent = async () => {
        if (!studentSearch) return;
        setSearching(true);
        try {
            const res = await api.get(`/students?search=${studentSearch}&limit=1`);
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

    const sessions = sessionsData?.data ?? [];
    const classes = classesData?.data ?? [];
    const settings = settingsData?.data ?? [];
    const classPromotions = classPromotionsData?.data ?? [];
    const summary = summaryData?.data ?? {};

    const tabs = [
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'auto', label: 'Auto Promotion', icon: '🤖' },
        { id: 'manual', label: 'Manual Override', icon: '✋' },
        { id: 'results', label: 'Results', icon: '📊' },
    ];

    const statusColors = {
        promoted: 'bg-green-100 text-green-700',
        repeated: 'bg-yellow-100 text-yellow-700',
        graduated: 'bg-blue-100 text-blue-700',
        withdrawn: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Promotions</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Manage student promotions, repetitions and graduations
                </p>
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

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="section-title mb-2">
                            Set Promotion Pass Percentage
                        </h2>
                        <p className="text-purple-400 text-sm mb-6">
                            Students must achieve this average score across
                            all subjects across all three terms to be promoted.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4 mb-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Session <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={settingsForm.session_id}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        session_id: e.target.value
                                    })}
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
                                <label className="form-label">
                                    Pass Percentage <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsForm.pass_percentage}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        pass_percentage: e.target.value
                                    })}
                                    className="input-field"
                                    placeholder="e.g., 45"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (!settingsForm.session_id || !settingsForm.pass_percentage) {
                                            toast.error('All fields are required.');
                                            return;
                                        }
                                        setSettingsMutation.mutate({
                                            session_id: settingsForm.session_id,
                                            pass_percentage: parseFloat(settingsForm.pass_percentage)
                                        });
                                    }}
                                    disabled={setSettingsMutation.isPending}
                                    className="btn-primary w-full"
                                >
                                    {setSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* EXISTING SETTINGS */}
                    {settings.length > 0 && (
                        <div className="card p-0 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="section-title">Existing Settings</h3>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Pass Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map((setting) => (
                                        <tr key={setting.id}>
                                            <td className="font-medium text-purple-900">
                                                {setting.session_name}
                                            </td>
                                            <td>
                                                <span className="font-bold text-purple-700 text-lg">
                                                    {setting.pass_percentage}%
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

            {/* AUTO PROMOTION TAB */}
            {activeTab === 'auto' && (
                <div className="card">
                    <h2 className="section-title mb-2">Run Auto Promotion</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        The system will calculate each student's average
                        score across all three terms and automatically
                        promote or repeat them based on the pass percentage.
                        SSS3 students will be automatically graduated.
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-yellow-800 text-sm">
                                    Before running auto promotion:
                                </p>
                                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                                    <li>✓ All three term scores must be entered</li>
                                    <li>✓ Report cards must be generated for all terms</li>
                                    <li>✓ Promotion settings must be set for this session</li>
                                    <li>✓ Next session must be created</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        <div className="form-group">
                            <label className="form-label">
                                Class <span className="text-red-500">*</span>
                            </label>
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
                            <label className="form-label">
                                Current Session <span className="text-red-500">*</span>
                            </label>
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
                            <label className="form-label">
                                Next Session <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedNextSession}
                                onChange={(e) => setSelectedNextSession(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Select next session</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.session_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (!selectedClass || !selectedSession || !selectedNextSession) {
                                toast.error('Please select class, current session and next session.');
                                return;
                            }
                            autoPromotionMutation.mutate({
                                class_id: selectedClass,
                                session_id: selectedSession,
                                next_session_id: selectedNextSession
                            });
                        }}
                        disabled={autoPromotionMutation.isPending}
                        className="btn-primary"
                    >
                        {autoPromotionMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Running...
                            </span>
                        ) : (
                            '🤖 Run Auto Promotion'
                        )}
                    </button>
                </div>
            )}

            {/* MANUAL OVERRIDE TAB */}
            {activeTab === 'manual' && (
                <div className="card">
                    <h2 className="section-title mb-2">Manual Promotion Override</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        Search for a student and manually set their
                        promotion status. You can promote, demote,
                        graduate, repeat or withdraw any student.
                    </p>

                    {/* SEARCH */}
                    <div className="flex gap-2 mb-6">
                        <input
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="input-field"
                            placeholder="Search by name or admission number"
                            onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                        />
                        <button
                            onClick={searchStudent}
                            disabled={searching}
                            className="btn-primary px-6 whitespace-nowrap"
                        >
                            {searching ? '...' : 'Search'}
                        </button>
                    </div>

                    {/* FOUND STUDENT */}
                    {foundStudent && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                                        <span className="text-purple-700 font-bold">
                                            {foundStudent.first_name?.[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-purple-900">
                                            {foundStudent.first_name} {foundStudent.last_name}
                                        </p>
                                        <p className="text-purple-400 text-sm">
                                            {foundStudent.admission_number} ·{' '}
                                            {foundStudent.class_name || 'No class'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowManualModal(true)}
                                    className="btn-primary text-sm"
                                >
                                    Set Status
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ACTION CARDS */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                            { action: 'promote', icon: '⬆️', label: 'Promote', color: 'bg-green-50 border-green-200 text-green-700' },
                            { action: 'demote', icon: '⬇️', label: 'Demote', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                            { action: 'repeat', icon: '🔄', label: 'Repeat', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                            { action: 'graduate', icon: '🎓', label: 'Graduate', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                            { action: 'withdraw', icon: '🚪', label: 'Withdraw', color: 'bg-red-50 border-red-200 text-red-700' },
                        ].map((item) => (
                            <div key={item.action}
                                className={`rounded-xl p-4 border text-center ${item.color}`}>
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <p className="font-semibold text-sm">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
                <div className="space-y-6">
                    <div className="card">
                        <div className="grid sm:grid-cols-2 gap-4">
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
                        </div>
                    </div>

                    {/* SUMMARY CARDS */}
                    {selectedSession && summary && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Students', value: summary.total_students, color: 'bg-purple-50', text: 'text-purple-700' },
                                { label: 'Promoted', value: summary.promoted, color: 'bg-green-50', text: 'text-green-700' },
                                { label: 'Repeated', value: summary.repeated, color: 'bg-yellow-50', text: 'text-yellow-700' },
                                { label: 'Graduated', value: summary.graduated, color: 'bg-blue-50', text: 'text-blue-700' },
                            ].map((stat) => (
                                <div key={stat.label}
                                    className={`${stat.color} rounded-xl p-4 border border-white`}>
                                    <p className={`text-2xl font-bold ${stat.text}`}>
                                        {stat.value || 0}
                                    </p>
                                    <p className="text-gray-500 text-sm">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CLASS PROMOTIONS TABLE */}
                    {classPromotions.length > 0 && (
                        <div className="card p-0 overflow-hidden">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>From Class</th>
                                        <th>To Class</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classPromotions.map((promotion) => (
                                        <tr key={promotion.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {promotion.first_name} {promotion.last_name}
                                                    </p>
                                                    <p className="text-purple-400 text-xs">
                                                        {promotion.admission_number}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="text-purple-600 text-sm">
                                                {promotion.from_class_name}
                                            </td>
                                            <td className="text-purple-600 text-sm">
                                                {promotion.to_class_name || 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                    statusColors[promotion.promotion_status] || 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {promotion.promotion_status}
                                                </span>
                                            </td>
                                            <td className="text-purple-500 text-sm">
                                                {promotion.remarks || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MANUAL PROMOTION MODAL */}
            {showManualModal && foundStudent && (
                <ManualPromotionModal
                    student={foundStudent}
                    sessions={sessions}
                    onClose={() => setShowManualModal(false)}
                    onSubmit={(action, data) => {
                        manualPromotionMutation.mutate({
                            studentId: foundStudent.id,
                            data: { action, ...data }
                        });
                    }}
                    isPending={manualPromotionMutation.isPending}
                />
            )}
        </div>
    );
};


// ============================================
// MANUAL PROMOTION MODAL
// ============================================
const ManualPromotionModal = ({ student, sessions, onClose, onSubmit, isPending }) => {
    const [form, setForm] = useState({
        action: '',
        session_id: '',
        next_session_id: '',
        remarks: ''
    });

    const actions = [
        { value: 'promote', label: 'Promote', icon: '⬆️', desc: 'Move student up one class' },
        { value: 'demote', label: 'Demote', icon: '⬇️', desc: 'Move student down one class' },
        { value: 'repeat', label: 'Repeat', icon: '🔄', desc: 'Keep student in same class' },
        { value: 'graduate', label: 'Graduate', icon: '🎓', desc: 'Mark student as graduated' },
        { value: 'withdraw', label: 'Withdraw', icon: '🚪', desc: 'Student left the school' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.action || !form.session_id) {
            toast.error('Action and session are required.');
            return;
        }
        onSubmit(form.action, {
            session_id: form.session_id,
            next_session_id: form.next_session_id || form.session_id,
            remarks: form.remarks
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Manual Promotion
                        </h2>
                        <p className="text-purple-400 text-sm">
                            {student.first_name} {student.last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* ACTION SELECTION */}
                    <div className="form-group">
                        <label className="form-label">
                            Action <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {actions.map((action) => (
                                <button
                                    key={action.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, action: action.value })}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        form.action === action.value
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-200'
                                    }`}
                                >
                                    <span className="text-xl">{action.icon}</span>
                                    <div>
                                        <p className="font-medium text-purple-900 text-sm">
                                            {action.label}
                                        </p>
                                        <p className="text-purple-400 text-xs">
                                            {action.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SESSION */}
                    <div className="form-group">
                        <label className="form-label">
                            Current Session <span className="text-red-500">*</span>
                        </label>
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

                    {/* NEXT SESSION */}
                    {(form.action === 'promote' || form.action === 'demote' || form.action === 'repeat') && (
                        <div className="form-group">
                            <label className="form-label">Next Session</label>
                            <select
                                value={form.next_session_id}
                                onChange={(e) => setForm({ ...form, next_session_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select next session</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* REMARKS */}
                    <div className="form-group">
                        <label className="form-label">Remarks</label>
                        <input
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            className="input-field"
                            placeholder="Optional reason for this action"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                            {isPending ? 'Saving...' : 'Apply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionsPage;