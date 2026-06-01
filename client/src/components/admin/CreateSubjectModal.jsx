import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateSubjectModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        subject_name: '',
        subject_code: ''
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/academic/subjects', data);
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
        if (!form.subject_name || !form.subject_code) {
            toast.error('All fields are required.');
            return;
        }
        mutation.mutate(form);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Create Subject
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Subject Name <span className="text-red-500">*</span></label>
                        <input
                            value={form.subject_name}
                            onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                            className="input-field"
                            placeholder="e.g., Mathematics"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Subject Code <span className="text-red-500">*</span></label>
                        <input
                            value={form.subject_code}
                            onChange={(e) => setForm({ ...form, subject_code: e.target.value.toUpperCase() })}
                            className="input-field"
                            placeholder="e.g., MTH"
                        />
                        <p className="text-purple-400 text-xs mt-1">
                            Short unique code for this subject
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Creating...' : 'Create Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSubjectModal;