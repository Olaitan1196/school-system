import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateTermModal = ({ sessions, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        session_id: '',
        term_name: '',
        start_date: '',
        end_date: '',
        is_current: false
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/academic/terms', data);
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
        if (!form.session_id || !form.term_name || !form.start_date || !form.end_date) {
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
                        Create Term
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Academic Session <span className="text-red-500">*</span></label>
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
                        <label className="form-label">Term Name <span className="text-red-500">*</span></label>
                        <select
                            value={form.term_name}
                            onChange={(e) => setForm({ ...form, term_name: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Select term</option>
                            <option value="First Term">First Term</option>
                            <option value="Second Term">Second Term</option>
                            <option value="Third Term">Third Term</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_current}
                            onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                            className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-purple-700 text-sm font-medium">
                            Set as current term
                        </span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Creating...' : 'Create Term'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTermModal;