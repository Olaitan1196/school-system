import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    // FETCH SCHOOL INFO
    const { data: schoolData } = useQuery({
        queryKey: ['school'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // CHANGE PASSWORD MUTATION
    const changePasswordMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put('/auth/change-password', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setPasswordForm({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!passwordForm.old_password || !passwordForm.new_password) {
            toast.error('All fields are required.');
            return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('New passwords do not match.');
            return;
        }
        if (passwordForm.new_password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        changePasswordMutation.mutate({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password
        });
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: '👤' },
        { id: 'password', label: 'Change Password', icon: '🔒' },
        { id: 'system', label: 'System Info', icon: '⚙️' },
    ];

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Manage your account and system settings
                </p>
            </div>

            {/* TABS */}
            <div className="flex gap-1 bg-purple-50 p-1 rounded-xl w-fit">
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

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="card max-w-lg">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-2xl font-bold">
                                {user?.first_name?.[0] || 'A'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-purple-950"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                {user?.first_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : 'Administrator'
                                }
                            </h2>
                            <span className="badge-purple capitalize">
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: 'Email', value: user?.email || 'Not set', icon: '✉️' },
                            { label: 'Phone', value: user?.phone || 'Not set', icon: '📞' },
                            { label: 'Role', value: user?.role?.replace('_', ' ') || 'Admin', icon: '🎭' },
                        ].map((item) => (
                            <div key={item.label}
                                className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-purple-400 text-sm">{item.label}</span>
                                </div>
                                <span className="text-purple-900 text-sm font-medium capitalize">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CHANGE PASSWORD TAB */}
            {activeTab === 'password' && (
                <div className="card max-w-lg">
                    <h2 className="section-title mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        {[
                            { key: 'old_password', label: 'Current Password', showKey: 'old' },
                            { key: 'new_password', label: 'New Password', showKey: 'new' },
                            { key: 'confirm_password', label: 'Confirm New Password', showKey: 'confirm' },
                        ].map((field) => (
                            <div key={field.key} className="form-group">
                                <label className="form-label">
                                    {field.label} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords[field.showKey] ? 'text' : 'password'}
                                        value={passwordForm[field.key]}
                                        onChange={(e) => setPasswordForm({
                                            ...passwordForm,
                                            [field.key]: e.target.value
                                        })}
                                        className="input-field pr-12"
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({
                                            ...showPasswords,
                                            [field.showKey]: !showPasswords[field.showKey]
                                        })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
                                    >
                                        {showPasswords[field.showKey] ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <p className="text-purple-600 text-xs font-medium mb-1">
                                Password requirements:
                            </p>
                            <ul className="text-purple-500 text-xs space-y-0.5">
                                <li className={`flex items-center gap-1 ${
                                    passwordForm.new_password.length >= 6
                                        ? 'text-green-600'
                                        : ''
                                }`}>
                                    {passwordForm.new_password.length >= 6 ? '✅' : '○'}{' '}
                                    At least 6 characters
                                </li>
                                <li className={`flex items-center gap-1 ${
                                    passwordForm.new_password === passwordForm.confirm_password &&
                                    passwordForm.confirm_password.length > 0
                                        ? 'text-green-600'
                                        : ''
                                }`}>
                                    {passwordForm.new_password === passwordForm.confirm_password &&
                                    passwordForm.confirm_password.length > 0 ? '✅' : '○'}{' '}
                                    Passwords match
                                </li>
                            </ul>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={changePasswordMutation.isPending}
                                className="btn-primary"
                            >
                                {changePasswordMutation.isPending
                                    ? 'Changing...'
                                    : 'Change Password'
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SYSTEM INFO TAB */}
            {activeTab === 'system' && (
                <div className="space-y-4 max-w-lg">
                    <div className="card">
                        <h2 className="section-title mb-4">System Information</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'School Name', value: "Comforters' College" },
                                { label: 'System Version', value: '1.0.0' },
                                { label: 'Database', value: 'PostgreSQL + Supabase' },
                                { label: 'Frontend', value: 'React + Vite + Tailwind' },
                                { label: 'Backend', value: 'Node.js + Express' },
                            ].map((item) => (
                                <div key={item.label}
                                    className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                    <span className="text-purple-400 text-sm">{item.label}</span>
                                    <span className="text-purple-900 text-sm font-medium">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card bg-gradient-to-r from-purple-900 to-purple-800 border-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-semibold">System Status</p>
                                <p className="text-purple-300 text-sm">All services running</p>
                            </div>
                            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-green-300 text-sm font-medium">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;