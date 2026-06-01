import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AssignSubjectModal = ({ classes, subjects, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        stream_id: '',
        is_compulsory: true
    });

    const selectedClass = classes.find(c => c.id === form.class_id);
    const streams = selectedClass?.streams || [];

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/academic/subjects/assign', data);
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
        if (!form.class_id || !form.subject_id) {
            toast.error('Class and subject are required.');
            return;
        }
        mutation.mutate({
            ...form,
            stream_id: form.stream_id || null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Assign Subject to Class
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            <label className="form-label">Stream (Optional)</label>
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
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_compulsory}
                            onChange={(e) => setForm({ ...form, is_compulsory: e.target.checked })}
                            className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-purple-700 text-sm font-medium">
                            Compulsory subject
                        </span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Assigning...' : 'Assign Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignSubjectModal;