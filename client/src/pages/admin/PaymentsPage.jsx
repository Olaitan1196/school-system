import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    // FETCH PAYMENTS
    const { data, isLoading } = useQuery({
        queryKey: ['payments', statusFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('payment_status', statusFilter);
            params.append('page', page);
            params.append('limit', 15);
            const res = await api.get(`/fees/payments?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    // REVIEW PAYMENT MUTATION
    const reviewMutation = useMutation({
        mutationFn: async ({ paymentId, data }) => {
            const res = await api.patch(
                `/fees/payments/${paymentId}/review`,
                data
            );
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setShowReviewModal(false);
            setSelectedPayment(null);
            queryClient.invalidateQueries(['payments']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    // DELETE PAYMENT MUTATION
    const deleteMutation = useMutation({
        mutationFn: async (paymentId) => {
            const res = await api.delete(`/fees/payments/${paymentId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['payments']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const payments = data?.data ?? [];
    const pagination = data?.pagination ?? {};

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };

    const methodIcons = {
        cash: '💵',
        bank_transfer: '🏦',
        pos: '💳',
        online: '🌐',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Payments</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Review, approve and manage all payments
                    </p>
                </div>
                <button
                    onClick={() => setShowManualModal(true)}
                    className="btn-primary text-sm self-start sm:self-auto"
                >
                    ➕ Add Manual Payment
                </button>
            </div>

            {/* STATUS FILTER */}
            <div className="flex flex-wrap gap-2">
                {[
                    { value: '', label: 'All Payments' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
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

            {/* PAYMENTS TABLE */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">💳</div>
                        <p className="text-purple-400 font-medium">
                            No payments found
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Reference</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-purple-900 text-sm">
                                                    {payment.first_name} {payment.last_name}
                                                </p>
                                                <p className="text-purple-400 text-xs">
                                                    {payment.admission_number}
                                                </p>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                {payment.payment_reference}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-bold text-purple-900">
                                                ₦{parseFloat(payment.amount_paid).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-purple-600">
                                                {methodIcons[payment.payment_method]}{' '}
                                                {payment.payment_method.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {new Date(payment.payment_date).toLocaleDateString('en-NG')}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                statusColors[payment.payment_status]
                                            }`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {payment.payment_status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setShowReviewModal(true);
                                                            }}
                                                            className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
                                                        >
                                                            Review
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Delete this payment?')) {
                                                                    deleteMutation.mutate(payment.id);
                                                                }
                                                            }}
                                                            className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {payment.payment_status === 'approved' && (
                                                    <span className="text-xs text-green-600 font-medium">
                                                        ✅ Approved
                                                    </span>
                                                )}
                                                {payment.payment_status === 'rejected' && (
                                                    <span className="text-xs text-red-600 font-medium">
                                                        ❌ Rejected
                                                    </span>
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
            {showReviewModal && selectedPayment && (
                <ReviewPaymentModal
                    payment={selectedPayment}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedPayment(null);
                    }}
                    onSubmit={(action, data) => {
                        reviewMutation.mutate({
                            paymentId: selectedPayment.id,
                            data: { action, ...data }
                        });
                    }}
                    isPending={reviewMutation.isPending}
                />
            )}

            {/* MANUAL PAYMENT MODAL */}
            {showManualModal && (
                <ManualPaymentModal
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => {
                        setShowManualModal(false);
                        queryClient.invalidateQueries(['payments']);
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// REVIEW PAYMENT MODAL
// ============================================
const ReviewPaymentModal = ({ payment, onClose, onSubmit, isPending }) => {
    const [action, setAction] = useState('');
    const [newAmount, setNewAmount] = useState(payment.amount_paid);
    const [reviewNote, setReviewNote] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!action) {
            toast.error('Please select an action.');
            return;
        }
        if (action === 'amount_changed' && !newAmount) {
            toast.error('New amount is required.');
            return;
        }
        onSubmit(action, {
            new_amount: action === 'amount_changed' ? parseFloat(newAmount) : undefined,
            review_note: reviewNote
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Review Payment
                        </h2>
                        <p className="text-purple-400 text-sm">
                            {payment.payment_reference}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>

                {/* PAYMENT DETAILS */}
                <div className="px-6 pt-4">
                    <div className="bg-purple-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-purple-400 text-xs">Student</p>
                                <p className="font-medium text-purple-900">
                                    {payment.first_name} {payment.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-purple-400 text-xs">Amount</p>
                                <p className="font-bold text-purple-900">
                                    ₦{parseFloat(payment.amount_paid).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-purple-400 text-xs">Method</p>
                                <p className="font-medium text-purple-900 capitalize">
                                    {payment.payment_method.replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-purple-400 text-xs">Date</p>
                                <p className="font-medium text-purple-900">
                                    {new Date(payment.payment_date).toLocaleDateString('en-NG')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    {/* ACTION */}
                    <div className="form-group">
                        <label className="form-label">Action <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'approved', label: '✅ Approve', color: 'border-green-300 bg-green-50 text-green-700' },
                                { value: 'rejected', label: '❌ Reject', color: 'border-red-300 bg-red-50 text-red-700' },
                                { value: 'amount_changed', label: '✏️ Edit Amount', color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAction(opt.value)}
                                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                                        action === opt.value
                                            ? opt.color
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NEW AMOUNT */}
                    {action === 'amount_changed' && (
                        <div className="form-group">
                            <label className="form-label">New Amount (₦)</label>
                            <input
                                type="number"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    )}

                    {/* REVIEW NOTE */}
                    <div className="form-group">
                        <label className="form-label">Review Note</label>
                        <input
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="input-field"
                            placeholder="Optional reason for this action"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                            {isPending ? 'Saving...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ============================================
// MANUAL PAYMENT MODAL
// ============================================
const ManualPaymentModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        invoice_id: '',
        student_id: '',
        amount_paid: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        note: ''
    });
    const [studentSearch, setStudentSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [foundInvoice, setFoundInvoice] = useState(null);
    const [searching, setSearching] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState('');

    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    const terms = termsData?.data ?? [];

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

    const loadInvoice = async () => {
        if (!foundStudent || !selectedTerm) return;
        try {
            const res = await api.get(
                `/fees/invoices/${foundStudent.id}/${selectedTerm}`
            );
            setFoundInvoice(res.data.data);
            setForm({ ...form, invoice_id: res.data.data.invoice.id });
        } catch (error) {
            toast.error('Invoice not found for this student and term.');
            setFoundInvoice(null);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/fees/payments/manual', data);
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
        if (!form.invoice_id || !form.student_id || !form.amount_paid) {
            toast.error('Invoice, student and amount are required.');
            return;
        }
        mutation.mutate({
            ...form,
            amount_paid: parseFloat(form.amount_paid)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Add Manual Payment
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* SEARCH STUDENT */}
                    <div className="form-group">
                        <label className="form-label">Search Student</label>
                        <div className="flex gap-2">
                            <input
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="input-field"
                                placeholder="Name or admission number"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudent())}
                            />
                            <button
                                type="button"
                                onClick={searchStudent}
                                disabled={searching}
                                className="btn-primary px-4"
                            >
                                {searching ? '...' : 'Find'}
                            </button>
                        </div>
                    </div>

                    {/* FOUND STUDENT */}
                    {foundStudent && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-green-800 font-medium text-sm">
                                ✓ {foundStudent.first_name} {foundStudent.last_name}
                            </p>
                            <p className="text-green-600 text-xs">{foundStudent.admission_number}</p>
                        </div>
                    )}

                    {/* SELECT TERM AND LOAD INVOICE */}
                    {foundStudent && (
                        <div className="form-group">
                            <label className="form-label">Term</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">Select term</option>
                                    {terms.map((t) => (
                                        <option key={t.id} value={t.id}>{t.term_name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={loadInvoice}
                                    className="btn-secondary px-4 whitespace-nowrap"
                                >
                                    Load Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {/* INVOICE DETAILS */}
                    {foundInvoice && (
                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <p className="text-purple-700 text-sm font-medium mb-1">
                                Invoice: {foundInvoice.invoice.invoice_number}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <p className="text-purple-400">Total</p>
                                    <p className="font-bold text-purple-900">
                                        ₦{parseFloat(foundInvoice.invoice.total_amount).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-purple-400">Paid</p>
                                    <p className="font-bold text-green-700">
                                        ₦{parseFloat(foundInvoice.invoice.total_paid).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-purple-400">Balance</p>
                                    <p className="font-bold text-red-700">
                                        ₦{parseFloat(foundInvoice.invoice.balance).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AMOUNT */}
                    <div className="form-group">
                        <label className="form-label">
                            Amount (₦) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={form.amount_paid}
                            onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                            className="input-field"
                            placeholder="e.g., 15000"
                        />
                    </div>

                    {/* METHOD */}
                    <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select
                            value={form.payment_method}
                            onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                            className="input-field"
                        >
                            <option value="cash">💵 Cash</option>
                            <option value="bank_transfer">🏦 Bank Transfer</option>
                            <option value="pos">💳 POS</option>
                            <option value="online">🌐 Online</option>
                        </select>
                    </div>

                    {/* DATE */}
                    <div className="form-group">
                        <label className="form-label">Payment Date</label>
                        <input
                            type="date"
                            value={form.payment_date}
                            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    {/* NOTE */}
                    <div className="form-group">
                        <label className="form-label">Note</label>
                        <input
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            className="input-field"
                            placeholder="Optional note"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Add Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentsPage;