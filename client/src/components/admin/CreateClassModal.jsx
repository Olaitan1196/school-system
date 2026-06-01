import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateClassModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        class_name: '',
        class_level: '',
        class_number: ''
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/academic/classes', data);
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

    const handleLevelChange = (level) => {
        setForm({ ...form, class_level: level, class_name: '', class_number: '' });
    };

    const handleNumberChange = (number) => {
        const name = `${form.class_level} ${number}`;
        setForm({ ...form, class_number: number, class_name: name });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.class_name || !form.class_level || !form.class_number) {
            toast.error('All fields are required.');
            return;
        }
        mutation.mutate({
            ...form,
            class_number: parseInt(form.class_number)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Create Class
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Class Level <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                            {['JSS', 'SSS'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => handleLevelChange(level)}
                                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                                        form.class_level === level
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.class_level && (
                        <div className="form-group">
                            <label className="form-label">Class Number <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleNumberChange(num)}
                                        className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                                            parseInt(form.class_number) === num
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                        }`}
                                    >
                                        {form.class_level} {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {form.class_name && (
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                            <p className="text-purple-400 text-xs mb-1">Class will be created as:</p>
                            <p className="text-purple-900 font-bold text-lg"
                               style={{ fontFamily: "'Playfair Display', serif" }}>
                                {form.class_name}
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Creating...' : 'Create Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClassModal;