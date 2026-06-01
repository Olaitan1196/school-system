import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddStudentModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        gender: '',
        state_of_origin: '',
        religion: '',
        admission_date: '',
        phone: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/students', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            onSuccess();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add student.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.first_name || !form.last_name || !form.gender) {
            toast.error('First name, last name and gender are required.');
            return;
        }
        mutation.mutate(form);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Add New Student
                        </h2>
                        <p className="text-purple-400 text-sm mt-0.5">
                            Fill in the student details below
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* NAME ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="first_name"
                                value={form.first_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., John"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="last_name"
                                value={form.last_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Middle Name</label>
                            <input
                                name="middle_name"
                                value={form.middle_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., James"
                            />
                        </div>
                    </div>

                    {/* GENDER AND DOB */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* STATE AND RELIGION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">State of Origin</label>
                            <input
                                name="state_of_origin"
                                value={form.state_of_origin}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., Lagos"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Religion</label>
                            <select
                                name="religion"
                                value={form.religion}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="">Select religion</option>
                                <option value="Christianity">Christianity</option>
                                <option value="Islam">Islam</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>

                    {/* ADMISSION DATE */}
                    <div className="form-group">
                        <label className="form-label">Admission Date</label>
                        <input
                            type="date"
                            name="admission_date"
                            value={form.admission_date}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    {/* DIVIDER */}
                    <div className="divider">
                        <p className="text-purple-400 text-xs text-center bg-white px-2 -mt-3 mx-auto w-fit">
                            Login Credentials (Optional)
                        </p>
                    </div>

                    {/* CONTACT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., 08012345678"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., john@email.com"
                            />
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Leave blank to use default: student1234"
                        />
                        <p className="text-purple-400 text-xs mt-1">
                            Default password is student1234 if left blank
                        </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="btn-primary"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Add Student'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;