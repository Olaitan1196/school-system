import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherDetailModal = ({ teacher, onClose, onUpdate }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [form, setForm] = useState({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        middle_name: teacher.middle_name || '',
        date_of_birth: teacher.date_of_birth?.split('T')[0] || '',
        gender: teacher.gender || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
    });

    // FETCH FULL TEACHER DETAILS
    const { data: teacherDetails, refetch } = useQuery({
        queryKey: ['teacher-detail', teacher.id],
        queryFn: async () => {
            const res = await api.get(`/teachers/${teacher.id}`);
            return res.data.data;
        }
    });

    // UPDATE MUTATION
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/teachers/${teacher.id}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setIsEditing(false);
            refetch();
            onUpdate();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Update failed.');
        }
    });

    // REMOVE ASSIGNMENT MUTATION
    const removeAssignmentMutation = useMutation({
        mutationFn: async (assignmentId) => {
            const res = await api.delete(
                `/teachers/assignments/${assignmentId}`
            );
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            refetch();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateMutation.mutate(form);
    };

    const details = teacherDetails || teacher;

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'assignments', label: 'Assignments', icon: '📚' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-violet-600 font-bold text-xl">
                                {details.first_name?.[0]}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-purple-950"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {details.first_name} {details.last_name}
                            </h2>
                            <p className="text-purple-400 text-sm">
                                {details.staff_id} · {details.specialization || 'No specialization'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                    >
                        ✕
                    </button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-100 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-purple-600 text-purple-700'
                                    : 'border-transparent text-purple-400 hover:text-purple-600'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    
                    ))}
                </div>

                {/* CONTENT */}
                <div className="p-6">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div>
                            {!isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'First Name', value: details.first_name },
                                            { label: 'Last Name', value: details.last_name },
                                            { label: 'Gender', value: details.gender || 'N/A' },
                                            { label: 'Phone', value: details.phone || 'N/A' },
                                            { label: 'Email', value: details.email || 'N/A' },
                                            { label: 'Qualification', value: details.qualification || 'N/A' },
                                            { label: 'Specialization', value: details.specialization || 'N/A' },
                                            { label: 'Date Joined', value: details.date_joined ? new Date(details.date_joined).toLocaleDateString('en-NG') : 'N/A' },
                                            { label: 'Status', value: details.is_active ? 'Active' : 'Inactive' },
                                            { label: 'Role', value: details.role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher' },
                                        ].map((item) => (
                                            <div key={item.label} className="bg-purple-50/50 rounded-xl p-3">
                                                <p className="text-purple-400 text-xs mb-1">{item.label}</p>
                                                <p className="text-purple-900 text-sm font-medium">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn-primary"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { name: 'first_name', label: 'First Name', type: 'text' },
                                            { name: 'last_name', label: 'Last Name', type: 'text' },
                                            { name: 'middle_name', label: 'Middle Name', type: 'text' },
                                            { name: 'phone', label: 'Phone', type: 'text' },
                                            { name: 'qualification', label: 'Qualification', type: 'text' },
                                            { name: 'specialization', label: 'Specialization', type: 'text' },
                                            { name: 'address', label: 'Address', type: 'text' },
                                            { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                                        ].map((field) => (
                                            <div key={field.name} className="form-group">
                                                <label className="form-label">{field.label}</label>
                                                <input
                                                    type={field.type}
                                                    name={field.name}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    className="input-field"
                                                />
                                            </div>
                                        ))}
                                        <div className="form-group">
                                            <label className="form-label">Gender</label>
                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                className="input-field"
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updateMutation.isPending}
                                            className="btn-primary"
                                        >
                                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="btn-primary text-sm"
                                >
                                    ➕ Add Assignment
                                </button>
                            </div>

                            {!details.assignments || details.assignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📚</div>
                                    <p className="text-purple-400">No assignments found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {details.assignments.map((assignment) => (
                                        <div key={assignment.id}
                                            className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                            <div>
                                                <p className="text-purple-900 text-sm font-medium">
                                                    {assignment.subject_name}
                                                </p>
                                                <p className="text-purple-400 text-xs">
                                                    {assignment.class_name}
                                                    {assignment.stream_name ? ` · ${assignment.stream_name}` : ''}
                                                    · {assignment.session_name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {assignment.is_class_teacher && (
                                                    <span className="badge-purple">Class Teacher</span>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Remove this assignment?')) {
                                                            removeAssignmentMutation.mutate(assignment.id);
                                                        }
                                                    }}
                                                    className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ADD ASSIGNMENT MODAL */}
            {showAssignModal && (
                <AddAssignmentModal
                    teacherId={teacher.id}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// ADD ASSIGNMENT MODAL
// ============================================
const AddAssignmentModal = ({ teacherId, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        subject_id: '',
        class_id: '',
        stream_id: '',
        session_id: '',
        is_class_teacher: false
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

    const subjects = subjectsData?.data ?? [];
    const classes = classesData?.data ?? [];
    const sessions = sessionsData?.data ?? [];

    const selectedClass = classes.find(c => c.id === form.class_id);
    const streams = selectedClass?.streams || [];

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post(
                `/teachers/${teacherId}/assignments`,
                data
            );
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
        if (!form.subject_id || !form.class_id || !form.session_id) {
            toast.error('Subject, class and session are required.');
            return;
        }
        mutation.mutate({
            ...form,
            stream_id: form.stream_id || null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Add Assignment
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            onChange={(e) => setForm({ ...form, class_id: e.target.value, stream_id: '' })}
                            className="input-field"
                        >
                            <option value="">Select class</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>
                    {streams.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Stream</label>
                            <select
                                value={form.stream_id}
                                onChange={(e) => setForm({ ...form, stream_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">All Streams</option>
                                {streams.map((s) => (
                                    <option key={s.id} value={s.id}>{s.stream_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
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
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_class_teacher}
                            onChange={(e) => setForm({ ...form, is_class_teacher: e.target.checked })}
                            className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-purple-700 text-sm font-medium">
                            Set as class teacher for this class
                        </span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Add Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherDetailModal;