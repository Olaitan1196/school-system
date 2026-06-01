import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ExamAccessPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [requestForm, setRequestForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        reason: ''
    });
    const [statusIdentifier, setStatusIdentifier] = useState('');
    const [requestStatus, setRequestStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('verify');

    // VERIFY MEMBER ACCESS
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) {
            toast.error('Please enter your ID or token.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/exam-access/verify', {
                identifier: identifier.trim()
            });
            if (res.data.access_granted) {
                toast.success(res.data.message);
                // Store access info and redirect
                sessionStorage.setItem('exam_access', JSON.stringify({
                    name: res.data.data.name,
                    identifier: res.data.data.identifier,
                    member_type: res.data.member_type
                }));
                navigate('/practice-exams');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Access denied.');
        } finally {
            setLoading(false);
        }
    };

    // SUBMIT ACCESS REQUEST
    const handleRequest = async (e) => {
        e.preventDefault();
        if (!requestForm.full_name) {
            toast.error('Full name is required.');
            return;
        }
        if (!requestForm.email && !requestForm.phone) {
            toast.error('Email or phone is required.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/exam-access/request', requestForm);
            toast.success(res.data.message);
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    // CHECK REQUEST STATUS
    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!statusIdentifier.trim()) {
            toast.error('Please enter your email or phone.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/exam-access/request/status', {
                identifier: statusIdentifier.trim()
            });
            setRequestStatus(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'No request found.');
            setRequestStatus(null);
        } finally {
            setLoading(false);
        }
    };

    // USE TOKEN FROM STATUS
    const handleUseToken = async (token) => {
        setLoading(true);
        try {
            const res = await api.post('/exam-access/verify', {
                identifier: token
            });
            if (res.data.access_granted) {
                sessionStorage.setItem('exam_access', JSON.stringify({
                    name: res.data.data.name,
                    identifier: token,
                    member_type: 'guest'
                }));
                navigate('/practice-exams');
            }
        } catch (error) {
            toast.error('Token is invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7ff]">

            {/* NAVBAR */}
            <nav className="bg-white border-b border-purple-100 px-4 sm:px-8 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <p className="font-bold text-purple-900"
                       style={{ fontFamily: "'Playfair Display', serif" }}>
                        Comforters' College
                    </p>
                </Link>
                <Link to="/" className="text-purple-500 hover:text-purple-700 text-sm transition-colors">
                    ← Back to Home
                </Link>
            </nav>

            <div className="max-w-lg mx-auto px-4 py-16">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                        🔐
                    </div>
                    <h1 className="text-3xl font-bold text-purple-950 mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Practice Exam Access
                    </h1>
                    <p className="text-purple-400 text-sm">
                        WAEC · UTME · NECO · BECE Mock Exams
                    </p>
                </div>

                {/* TABS */}
                <div className="flex gap-1 bg-purple-50 p-1 rounded-xl mb-6">
                    {[
                        { id: 'verify', label: 'I Have an ID/Token' },
                        { id: 'request', label: 'Request Access' },
                        { id: 'status', label: 'Check Status' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-purple-400 hover:text-purple-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* VERIFY TAB */}
                {activeTab === 'verify' && (
                    <div className="card">
                        <h2 className="section-title mb-2">Enter Your ID or Token</h2>
                        <p className="text-purple-400 text-sm mb-4">
                            Students and staff can enter their admission number
                            or staff ID. Approved visitors enter their access token.
                        </p>
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Admission Number, Staff ID or Access Token
                                </label>
                                <input
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="input-field font-mono"
                                    placeholder="e.g., CC/2024/001 or EXM-2024-XXXX"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Verifying...
                                    </span>
                                ) : (
                                    '🚀 Access Practice Exams'
                                )}
                            </button>
                        </form>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-purple-400 text-xs text-center">
                                Don't have access?{' '}
                                <button
                                    onClick={() => setActiveTab('request')}
                                    className="text-purple-600 font-medium hover:underline"
                                >
                                    Request access here
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* REQUEST TAB */}
                {activeTab === 'request' && step !== 3 && (
                    <div className="card">
                        <h2 className="section-title mb-2">Request Access</h2>
                        <p className="text-purple-400 text-sm mb-4">
                            Fill in your details. The school admin will review
                            your request and notify you via email or phone.
                        </p>
                        <form onSubmit={handleRequest} className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={requestForm.full_name}
                                    onChange={(e) => setRequestForm({ ...requestForm, full_name: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        value={requestForm.email}
                                        onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                                        className="input-field"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        value={requestForm.phone}
                                        onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="08012345678"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason for Access</label>
                                <textarea
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    className="input-field"
                                    rows={3}
                                    placeholder="Why do you need access to the practice exam portal?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                )}

                {/* REQUEST SUBMITTED */}
                {activeTab === 'request' && step === 3 && (
                    <div className="card text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-xl font-bold text-purple-950 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Request Submitted
                        </h2>
                        <p className="text-purple-400 text-sm mb-6">
                            Your request has been submitted successfully.
                            The school admin will review it and notify you.
                        </p>
                        <button
                            onClick={() => setActiveTab('status')}
                            className="btn-primary w-full"
                        >
                            Check Request Status
                        </button>
                    </div>
                )}

                {/* STATUS TAB */}
                {activeTab === 'status' && (
                    <div className="card">
                        <h2 className="section-title mb-2">Check Request Status</h2>
                        <p className="text-purple-400 text-sm mb-4">
                            Enter the email or phone you used when submitting your request.
                        </p>
                        <form onSubmit={handleCheckStatus} className="space-y-4 mb-4">
                            <div className="form-group">
                                <label className="form-label">Email or Phone</label>
                                <input
                                    value={statusIdentifier}
                                    onChange={(e) => setStatusIdentifier(e.target.value)}
                                    className="input-field"
                                    placeholder="Email or phone number"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full"
                            >
                                {loading ? 'Checking...' : 'Check Status'}
                            </button>
                        </form>

                        {/* STATUS RESULT */}
                        {requestStatus && (
                            <div className={`rounded-xl p-4 border ${
                                requestStatus.status === 'approved_free' ||
                                requestStatus.status === 'payment_confirmed'
                                    ? 'bg-green-50 border-green-200'
                                    : requestStatus.status === 'rejected'
                                    ? 'bg-red-50 border-red-200'
                                    : requestStatus.status === 'payment_pending'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-yellow-50 border-yellow-200'
                            }`}>
                                <p className="font-semibold text-sm mb-2">
                                    {requestStatus.message}
                                </p>

                                {/* TOKEN */}
                                {requestStatus.token && (
                                    <div className="mt-3">
                                        <p className="text-xs text-green-600 mb-2">
                                            Your access token:
                                        </p>
                                        <div className="bg-white rounded-lg p-3 border border-green-200 flex items-center justify-between gap-3">
                                            <span className="font-mono text-sm text-green-800 font-bold">
                                                {requestStatus.token}
                                            </span>
                                            <button
                                                onClick={() => handleUseToken(requestStatus.token)}
                                                className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                                            >
                                                Use Token →
                                            </button>
                                        </div>
                                        {requestStatus.token_expires_at && (
                                            <p className="text-xs text-green-500 mt-1">
                                                Expires: {new Date(requestStatus.token_expires_at).toLocaleDateString('en-NG')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* PAYMENT REQUIRED */}
                                {requestStatus.payment_amount && (
                                    <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                                        <p className="text-blue-800 font-semibold text-sm">
                                            Payment Required: ₦{parseFloat(requestStatus.payment_amount).toLocaleString()}
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                            Make payment and upload proof to the school admin.
                                            Once confirmed your access token will be generated.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamAccessPage;