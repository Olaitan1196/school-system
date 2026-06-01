import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EnrollStudentModal = ({ classes, sessions, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        student_id: '',
        class_id: '',
        stream_id: '',
        session_id: ''
    });
    const [studentSearch, setStudentSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [searching, setSearching] = useState(false);

    const selectedClass = classes.find(c => c.id === form.class_id);
    const streams = selectedClass?.streams || [];

    const searchStudent = async () => {
        if (!studentSearch) return;
        setSearching(true);
        try {
            const res = await api.get(`/students?search=${studentSearch}&limit=1`);
            if (res.data.data.length > 0) {
                const student = res.data.data[0];
                setFoundStudent(student);
                setForm({ ...form, student_id: student.id });
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

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/academic/enroll', data);
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
        if (!form.student_id || !form.class_id || !form.session_id) {
            toast.error('Student, class and session are required.');
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
                        Enroll Student
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* SEARCH STUDENT */}
                    <div className="form-group">
                        <label className="form-label">Search Student <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="input-field"
                                placeholder="Enter name or admission number"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudent())}
                            />
                            <button
                                type="button"
                                onClick={searchStudent}
                                disabled={searching}
                                className="btn-primary px-4 whitespace-nowrap"
                            >
                                {searching ? '...' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* FOUND STUDENT */}
                    {foundStudent && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-700 font-bold text-sm">
                                    {foundStudent.first_name?.[0]}
                                </span>
                            </div>
                            <div>
                                <p className="text-green-800 font-medium text-sm">
                                    {foundStudent.first_name} {foundStudent.last_name}
                                </p>
                                <p className="text-green-600 text-xs">
                                    {foundStudent.admission_number}
                                </p>
                            </div>
                            <span className="ml-auto text-green-500">✓</span>
                        </div>
                    )}

                    {/* CLASS */}
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

                    {/* STREAM */}
                    {streams.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Stream</label>
                            <select
                                value={form.stream_id}
                                onChange={(e) => setForm({ ...form, stream_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select stream</option>
                                {streams.map((s) => (
                                    <option key={s.id} value={s.id}>{s.stream_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* SESSION */}
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

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnrollStudentModal;