import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddTeacherModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        qualification: '',
        specialization: '',
        date_joined: '',
        password: '',
        role: 'subject_teacher'
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/teachers', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            onSuccess();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add teacher.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.first_name || !form.last_name || !form.gender || !form.phone) {
            toast.error('First name, last name, gender and phone are required.');
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
                            Add New Teacher
                        </h2>
                        <p className="text-purple-400 text-sm mt-0.5">
                            Fill in the teacher details below
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                    >
                        ✕
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* NAME */}
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
                                placeholder="e.g., Mary"
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
                                placeholder="e.g., Smith"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Middle Name</label>
                            <input
                                name="middle_name"
                                value={form.middle_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., Grace"
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

                    {/* PHONE AND EMAIL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., 08033333333"
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
                                placeholder="e.g., mary@school.com"
                            />
                        </div>
                    </div>

                    {/* QUALIFICATION AND SPECIALIZATION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Qualification</label>
                            <input
                                name="qualification"
                                value={form.qualification}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., B.Ed Mathematics"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <input
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., Mathematics"
                            />
                        </div>
                    </div>

                    {/* ROLE AND DATE JOINED */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="subject_teacher">Subject Teacher</option>
                                <option value="class_teacher">Class Teacher</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date Joined</label>
                            <input
                                type="date"
                                name="date_joined"
                                value={form.date_joined}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g., 5 Teacher Street, Abuja"
                        />
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
                            placeholder="Leave blank to use default: teacher1234"
                        />
                        <p className="text-purple-400 text-xs mt-1">
                            Default password is teacher1234 if left blank
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
                                'Add Teacher'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeacherModal;