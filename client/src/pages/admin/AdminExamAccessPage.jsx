import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminExamAccessPage = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // FETCH REQUESTS
    const { data, isLoading } = useQuery({
        queryKey: ['exam-access-requests', statusFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('request_status', statusFilter);
            params.append('page', page);
            params.append('limit', 15);
            const res = await api.get(`/exam-access/requests?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    // CONFIRM PAYMENT MUTATION
    const confirmPaymentMutation = useMutation({
        mutationFn: async ({ requestId, data }) => {
            const res = await api.patch(
                `/exam-access/requests/${requestId}/confirm-payment`,
                data
            );
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['exam-access-requests']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const requests = data?.data ?? [];
    const pagination = data?.pagination ?? {};

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved_free: 'bg-green-100 text-green-700',
        approved_paid: 'bg-blue-100 text-blue-700',
        rejected: 'bg-red-100 text-red-700',
        payment_pending: 'bg-orange-100 text-orange-700',
        payment_confirmed: 'bg-purple-100 text-purple-700',
    };

    const statusLabels = {
        pending: 'Pending Review',
        approved_free: 'Approved Free',
        approved_paid: 'Approved Paid',
        rejected: 'Rejected',
        payment_pending: 'Payment Pending',
        payment_confirmed: 'Payment Confirmed',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Exam Access Control</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Manage visitor requests to access the public exam portal
                </p>
            </div>

            {/* INFO CARD */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                        <p className="font-semibold text-purple-800 text-sm">
                            How this works
                        </p>
                        <p className="text-purple-500 text-sm mt-1">
                            When a visitor tries to access the public exam portal
                            without a student or staff ID, they submit a request here.
                            You can approve them for free, require payment, or reject.
                        </p>
                    </div>
                </div>
            </div>

            {/* STATUS FILTERS */}
            <div className="flex flex-wrap gap-2">
                {[
                    { value: '', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved_free', label: 'Approved Free' },
                    { value: 'payment_pending', label: 'Payment Pending' },
                    { value: 'payment_confirmed', label: 'Confirmed' },
                    { value: 'rejected', label: 'Rejected' },
                ].map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            statusFilter === filter.value
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* REQUESTS TABLE */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🔐</div>
                        <p className="text-purple-400 font-medium">
                            No requests found
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Token</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <p className="font-medium text-purple-900 text-sm">
                                                {request.full_name}
                                            </p>
                                            <p className="text-purple-400 text-xs">
                                                {new Date(request.created_at).toLocaleDateString('en-NG')}
                                            </p>
                                        </td>
                                        <td>
                                            <div className="text-sm text-purple-600">
                                                {request.email && <p>✉️ {request.email}</p>}
                                                {request.phone && <p>📞 {request.phone}</p>}
                                            </div>
                                        </td>
                                        <td>
                                            <p className="text-purple-500 text-sm max-w-xs truncate">
                                                {request.reason || 'No reason provided'}
                                            </p>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                statusColors[request.request_status]
                                            }`}>
                                                {statusLabels[request.request_status]}
                                            </span>
                                        </td>
                                        <td>
                                            {request.requires_payment ? (
                                                <div>
                                                    <p className="font-bold text-purple-900 text-sm">
                                                        ₦{parseFloat(request.payment_amount).toLocaleString()}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        request.payment_status === 'verified'
                                                            ? 'bg-green-100 text-green-700'
                                                            : request.payment_status === 'paid'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {request.payment_status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Free</span>
                                            )}
                                        </td>
                                        <td>
                                            {request.access_token ? (
                                                <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                    {request.access_token}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No token</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {request.request_status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowReviewModal(true);
                                                        }}
                                                        className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {request.request_status === 'payment_pending' &&
                                                    request.payment_status === 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Confirm this payment and generate access token?')) {
                                                                confirmPaymentMutation.mutate({
                                                                    requestId: request.id,
                                                                    data: { token_expires_days: 30 }
                                                                });
                                                            }
                                                        }}
                                                        className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        Confirm Payment
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <p className="text-sm text-purple-400">
                            Page {pagination.page} of {pagination.total_pages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={pagination.page >= pagination.total_pages}
                                className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* REVIEW MODAL */}
            {showReviewModal && selectedRequest && (
                <ReviewRequestModal
                    request={selectedRequest}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedRequest(null);
                    }}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        setSelectedRequest(null);
                        queryClient.invalidateQueries(['exam-access-requests']);
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// REVIEW REQUEST MODAL
// ============================================
const ReviewRequestModal = ({ request, onClose, onSuccess }) => {
    const [action, setAction] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [tokenExpiresDays, setTokenExpiresDays] = useState(30);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.patch(
                `/exam-access/requests/${request.id}/review`,
                data
            );
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
        if (!action) {
            toast.error('Please select an action.');
            return;
        }
        if (action === 'approve_paid' && !paymentAmount) {
            toast.error('Payment amount is required.');
            return;
        }
        if (action === 'reject' && !rejectionReason) {
            toast.error('Rejection reason is required.');
            return;
        }

        mutation.mutate({
            action,
            payment_amount: action === 'approve_paid'
                ? parseFloat(paymentAmount)
                : undefined,
            rejection_reason: action === 'reject'
                ? rejectionReason
                : undefined,
            token_expires_days: action === 'approve_free'
                ? parseInt(tokenExpiresDays)
                : undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Review Request
                        </h2>
                        <p className="text-purple-400 text-sm">
                            {request.full_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>

                {/* REQUEST DETAILS */}
                <div className="px-6 pt-4">
                    <div className="bg-purple-50 rounded-xl p-4 mb-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-purple-400">Name</span>
                                <span className="font-medium text-purple-900">{request.full_name}</span>
                            </div>
                            {request.email && (
                                <div className="flex justify-between">
                                    <span className="text-purple-400">Email</span>
                                    <span className="font-medium text-purple-900">{request.email}</span>
                                </div>
                            )}
                            {request.phone && (
                                <div className="flex justify-between">
                                    <span className="text-purple-400">Phone</span>
                                    <span className="font-medium text-purple-900">{request.phone}</span>
                                </div>
                            )}
                            {request.reason && (
                                <div>
                                    <span className="text-purple-400">Reason</span>
                                    <p className="font-medium text-purple-900 mt-1">{request.reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    {/* ACTION SELECTION */}
                    <div className="form-group">
                        <label className="form-label">
                            Decision <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {[
                                {
                                    value: 'approve_free',
                                    icon: '✅',
                                    label: 'Approve for Free',
                                    desc: 'Grant access without payment',
                                    color: 'border-green-300 bg-green-50'
                                },
                                {
                                    value: 'approve_paid',
                                    icon: '💰',
                                    label: 'Approve with Payment',
                                    desc: 'Require payment before access',
                                    color: 'border-blue-300 bg-blue-50'
                                },
                                {
                                    value: 'reject',
                                    icon: '❌',
                                    label: 'Reject Request',
                                    desc: 'Deny access to this visitor',
                                    color: 'border-red-300 bg-red-50'
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAction(opt.value)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        action === opt.value
                                            ? opt.color
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-xl">{opt.icon}</span>
                                    <div>
                                        <p className="font-medium text-purple-900 text-sm">{opt.label}</p>
                                        <p className="text-purple-400 text-xs">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CONDITIONAL FIELDS */}
                    {action === 'approve_free' && (
                        <div className="form-group">
                            <label className="form-label">Token Expires In (days)</label>
                            <input
                                type="number"
                                value={tokenExpiresDays}
                                onChange={(e) => setTokenExpiresDays(e.target.value)}
                                className="input-field"
                                placeholder="e.g., 30"
                            />
                            <p className="text-purple-400 text-xs mt-1">
                                Leave 30 for one month access
                            </p>
                        </div>
                    )}

                    {action === 'approve_paid' && (
                        <div className="form-group">
                            <label className="form-label">
                                Payment Amount (₦) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="input-field"
                                placeholder="e.g., 500"
                            />
                        </div>
                    )}

                    {action === 'reject' && (
                        <div className="form-group">
                            <label className="form-label">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="input-field"
                                placeholder="Why are you rejecting this request?"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Submit Decision'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminExamAccessPage;