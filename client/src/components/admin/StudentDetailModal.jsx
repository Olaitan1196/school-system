import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentDetailModal = ({ student, onClose, onUpdate }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        middle_name: student.middle_name || '',
        date_of_birth: student.date_of_birth?.split('T')[0] || '',
        gender: student.gender || '',
        state_of_origin: student.state_of_origin || '',
        religion: student.religion || '',
    });

    // FETCH FULL STUDENT DETAILS
    const { data: studentDetails } = useQuery({
        queryKey: ['student-detail', student.id],
        queryFn: async () => {
            const res = await api.get(`/students/${student.id}`);
            return res.data.data;
        }
    });

    // UPDATE MUTATION
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/students/${student.id}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setIsEditing(false);
            queryClient.invalidateQueries(['student-detail', student.id]);
            onUpdate();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Update failed.');
        }
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateMutation.mutate(form);
    };

    const details = studentDetails || student;

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'parents', label: 'Parents', icon: '👪' },
        { id: 'enrollment', label: 'Enrollment', icon: '📚' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            {details.passport_url ? (
                                <img
                                    src={details.passport_url}
                                    alt={details.first_name}
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-purple-600 font-bold text-xl">
                                    {details.first_name?.[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-purple-950"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {details.first_name} {details.last_name}
                            </h2>
                            <p className="text-purple-400 text-sm">
                                {details.admission_number}
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

                {/* TAB CONTENT */}
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
                                            { label: 'Middle Name', value: details.middle_name || 'N/A' },
                                            { label: 'Gender', value: details.gender || 'N/A' },
                                            { label: 'Date of Birth', value: details.date_of_birth ? new Date(details.date_of_birth).toLocaleDateString('en-NG') : 'N/A' },
                                            { label: 'State of Origin', value: details.state_of_origin || 'N/A' },
                                            { label: 'Religion', value: details.religion || 'N/A' },
                                            { label: 'Phone', value: details.phone || 'N/A' },
                                            { label: 'Email', value: details.email || 'N/A' },
                                            { label: 'Status', value: details.is_active ? 'Active' : 'Inactive' },
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
                                            { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                                            { name: 'state_of_origin', label: 'State of Origin', type: 'text' },
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
                                        <div className="form-group">
                                            <label className="form-label">Religion</label>
                                            <select
                                                name="religion"
                                                value={form.religion}
                                                onChange={handleChange}
                                                className="input-field"
                                            >
                                                <option value="">Select</option>
                                                <option value="Christianity">Christianity</option>
                                                <option value="Islam">Islam</option>
                                                <option value="Others">Others</option>
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

                    {/* PARENTS TAB */}
                    {activeTab === 'parents' && (
                        <div>
                            {details.parents?.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">👪</div>
                                    <p className="text-purple-400">No parent records found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {details.parents?.map((parent) => (
                                        <div key={parent.id}
                                            className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-purple-900">
                                                    {parent.first_name} {parent.last_name}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <span className="badge-purple">
                                                        {parent.relationship}
                                                    </span>
                                                    {parent.is_primary_contact && (
                                                        <span className="badge-success">Primary</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <p className="text-purple-500">📞 {parent.phone}</p>
                                                {parent.email && (
                                                    <p className="text-purple-500">✉️ {parent.email}</p>
                                                )}
                                                {parent.occupation && (
                                                    <p className="text-purple-500">💼 {parent.occupation}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ENROLLMENT TAB */}
                    {activeTab === 'enrollment' && (
                        <div>
                            {details.class_name ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'Current Class', value: details.class_name },
                                        { label: 'Stream', value: details.stream_name || 'N/A' },
                                        { label: 'Academic Session', value: details.current_session || 'N/A' },
                                    ].map((item) => (
                                        <div key={item.label}
                                            className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                            <span className="text-purple-400 text-sm">{item.label}</span>
                                            <span className="text-purple-900 text-sm font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📚</div>
                                    <p className="text-purple-400">Student is not enrolled in any class</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;