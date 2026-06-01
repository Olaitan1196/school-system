import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentInvoicePage = () => {
    const { user } = useAuth();
    const [selectedTerm, setSelectedTerm] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(false);

    // FETCH TERMS
    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    const terms = termsData?.data ?? [];

    const fetchInvoice = async () => {
        if (!selectedTerm || !user?.student_id) return;
        setLoading(true);
        try {
            const res = await api.get(
                `/fees/invoices/${user.student_id}/${selectedTerm}`
            );
            setInvoiceData(res.data.data);
        } catch (error) {
            if (error.response?.status === 404) {
                setInvoiceData(null);
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error('No invoice found for this term.');
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        unpaid: 'bg-red-100 text-red-700',
        partial: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
    };

    const paymentStatusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">My Invoice</h1>
                <p className="text-purple-400 text-sm mt-1">
                    View your fee invoice and payment history
                </p>
            </div>

            {/* SELECT TERM */}
            <div className="card">
                <div className="flex gap-3">
                    <select
                        value={selectedTerm}
                        onChange={(e) => {
                            setSelectedTerm(e.target.value);
                            setInvoiceData(null);
                        }}
                        className="input-field"
                    >
                        <option value="">Select term</option>
                        {terms.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.term_name} · {t.session_name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={fetchInvoice}
                        disabled={loading || !selectedTerm}
                        className="btn-primary whitespace-nowrap"
                    >
                        {loading ? 'Loading...' : 'View Invoice'}
                    </button>
                </div>
            </div>

            {/* INVOICE DISPLAY */}
            {invoiceData && (
                <div className="space-y-4">

                    {/* INVOICE HEADER */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-purple-950"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Invoice
                                </h2>
                                <p className="text-purple-400 text-sm">
                                    {invoiceData.invoice.invoice_number}
                                </p>
                            </div>
                            <span className={`text-sm px-3 py-1 rounded-full font-semibold capitalize ${
                                statusColors[invoiceData.invoice.invoice_status]
                            }`}>
                                {invoiceData.invoice.invoice_status}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                <p className="text-purple-400 text-xs">Total Amount</p>
                                <p className="text-purple-900 font-bold text-lg">
                                    ₦{parseFloat(invoiceData.invoice.total_amount).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                <p className="text-green-600 text-xs">Amount Paid</p>
                                <p className="text-green-700 font-bold text-lg">
                                    ₦{parseFloat(invoiceData.invoice.total_paid).toLocaleString()}
                                </p>
                            </div>
                            <div className={`rounded-xl p-3 text-center ${
                                parseFloat(invoiceData.invoice.balance) > 0
                                    ? 'bg-red-50'
                                    : 'bg-green-50'
                            }`}>
                                <p className={`text-xs ${
                                    parseFloat(invoiceData.invoice.balance) > 0
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                }`}>
                                    Balance
                                </p>
                                <p className={`font-bold text-lg ${
                                    parseFloat(invoiceData.invoice.balance) > 0
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                }`}>
                                    ₦{parseFloat(invoiceData.invoice.balance).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* INVOICE ITEMS */}
                    <div className="card p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="section-title">Fee Breakdown</h3>
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Amount Due</th>
                                    <th>Amount Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-purple-900 text-sm">
                                                    {item.item_name}
                                                </span>
                                                {item.is_result_fee && (
                                                    <span className="badge-purple text-xs">
                                                        Result Fee
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-purple-700 font-medium">
                                            ₦{parseFloat(item.amount_due).toLocaleString()}
                                        </td>
                                        <td className="text-green-600 font-medium">
                                            ₦{parseFloat(item.amount_paid).toLocaleString()}
                                        </td>
                                        <td className={`font-medium ${
                                            parseFloat(item.balance) > 0
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        }`}>
                                            ₦{parseFloat(item.balance).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                item.is_paid
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAYMENT HISTORY */}
                    {invoiceData.payments.length > 0 && (
                        <div className="card p-0 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="section-title">Payment History</h3>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceData.payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                    {payment.payment_reference}
                                                </span>
                                            </td>
                                            <td className="font-bold text-purple-900">
                                                ₦{parseFloat(payment.amount_paid).toLocaleString()}
                                            </td>
                                            <td className="text-purple-600 text-sm capitalize">
                                                {payment.payment_method.replace('_', ' ')}
                                            </td>
                                            <td className="text-purple-500 text-sm">
                                                {new Date(payment.payment_date).toLocaleDateString('en-NG')}
                                            </td>
                                            <td>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                    paymentStatusColors[payment.payment_status]
                                                }`}>
                                                    {payment.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* RESULT ACCESS INFO */}
                    {invoiceData.invoice.invoice_status === 'paid' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <span className="text-2xl">🎉</span>
                                <div>
                                    <p className="font-semibold text-green-800">
                                        Invoice Fully Paid
                                    </p>
                                    <p className="text-green-600 text-sm mt-1">
                                        Your result access token has been generated.
                                        Go to My Results to view your result.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {invoiceData.invoice.invoice_status !== 'paid' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        Outstanding Balance: ₦{parseFloat(invoiceData.invoice.balance).toLocaleString()}
                                    </p>
                                    <p className="text-yellow-600 text-sm mt-1">
                                        You must complete all payments before you can
                                        access your result. Visit the school to make payment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentInvoicePage;