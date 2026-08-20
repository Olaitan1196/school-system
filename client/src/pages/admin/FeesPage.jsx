import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FeesPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('items');
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showSetStructureModal, setShowSetStructureModal] = useState(false);
    const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [invoiceMode, setInvoiceMode] = useState('bulk'); // 'bulk' or 'single'
    const [studentSearch, setStudentSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [searchingStudent, setSearchingStudent] = useState(false);

    // FETCH FEE ITEMS
    const { data: feeItemsData } = useQuery({
        queryKey: ['fee-items'],
        queryFn: async () => {
            const res = await api.get('/fees/items');
            return res.data;
        }
    });

    // FETCH FEE STRUCTURES
    const { data: feeStructuresData } = useQuery({
        queryKey: ['fee-structures', selectedClass, selectedSession, selectedTerm],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedClass) params.append('class_id', selectedClass);
            if (selectedSession) params.append('session_id', selectedSession);
            if (selectedTerm) params.append('term_id', selectedTerm);
            const res = await api.get(`/fees/structures?${params}`);
            return res.data;
        }
    });

    // FETCH OUTSTANDING INVOICES
    const { data: outstandingData, isLoading: loadingOutstanding } = useQuery({
    queryKey: ['outstanding-invoices', selectedClass, selectedSession, selectedTerm],
    queryFn: async () => {
        const params = new URLSearchParams();
        if (selectedClass) params.append('class_id', selectedClass);
        if (selectedSession) params.append('session_id', selectedSession);
        if (selectedTerm) params.append('term_id', selectedTerm);
        const res = await api.get(`/fees/outstanding?${params}`);
        return res.data;
    },
    enabled: activeTab === 'outstanding'
    });

    const outstanding = outstandingData?.data ?? [];

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    // FETCH SESSIONS
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await api.get('/academic/sessions');
            return res.data;
        }
    });

    // FETCH TERMS
    const { data: termsData } = useQuery({
        queryKey: ['terms'],
        queryFn: async () => {
            const res = await api.get('/academic/terms');
            return res.data;
        }
    });

    // BULK GENERATE INVOICES
    const bulkInvoiceMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/fees/invoices/bulk', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

        // SEARCH STUDENT FOR SINGLE INVOICE
    const searchStudentForInvoice = async () => {
        if (!studentSearch) return;
        setSearchingStudent(true);
        try {
            const res = await api.get(`/students?search=${studentSearch}&limit=1`);
            if (res.data.data.length > 0) {
                setFoundStudent(res.data.data[0]);
            } else {
                toast.error('Student not found.');
                setFoundStudent(null);
            }
        } catch (error) {
            toast.error('Search failed.');
        } finally {
            setSearchingStudent(false);
        }
    };

    // SINGLE GENERATE INVOICE
    const singleInvoiceMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/fees/invoices', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setFoundStudent(null);
            setStudentSearch('');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const feeItems = feeItemsData?.data ?? [];
    const feeStructures = feeStructuresData?.data ?? [];
    const classes = classesData?.data ?? [];
    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];

    const tabs = [
        { id: 'items', label: 'Fee Items', icon: '📋' },
        { id: 'structures', label: 'Fee Structures', icon: '💰' },
        { id: 'invoices', label: 'Generate Invoices', icon: '🧾' },
        { id: 'outstanding', label: 'Outstanding', icon: '⚠️' },
    ];

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Fees & Invoicing</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Manage fee items, structures and generate invoices
                    </p>
                </div>
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

            {/* FEE ITEMS TAB */}
            {activeTab === 'items' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddItemModal(true)}
                            className="btn-primary text-sm"
                        >
                            ➕ Add Fee Item
                        </button>
                    </div>
                    <div className="card p-0 overflow-hidden">
                        {feeItems.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">📋</div>
                                <p className="text-purple-400 font-medium">
                                    No fee items found
                                </p>
                                <button
                                    onClick={() => setShowAddItemModal(true)}
                                    className="btn-primary mt-4"
                                >
                                    Add First Fee Item
                                </button>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Item Code</th>
                                        <th>Description</th>
                                        <th>Result Fee</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="font-medium text-purple-900">
                                                {item.item_name}
                                            </td>
                                            <td>
                                                <span className="font-mono text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                    {item.item_code}
                                                </span>
                                            </td>
                                            <td className="text-purple-500 text-sm">
                                                {item.description || 'N/A'}
                                            </td>
                                            <td>
                                                {item.is_result_fee ? (
                                                    <span className="badge-success">Yes</span>
                                                ) : (
                                                    <span className="badge-info">No</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={item.is_active
                                                    ? 'badge-success'
                                                    : 'badge-danger'
                                                }>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* FEE STRUCTURES TAB */}
            {activeTab === 'structures' && (
                <div className="space-y-4">
                    <div className="card">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Sessions</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                                ))}
                            </select>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Terms</option>
                                {terms.map((t) => (
                                    <option key={t.id} value={t.id}>{t.term_name}</option>
                                ))}
                            </select>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Classes</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowSetStructureModal(true)}
                                className="btn-primary text-sm"
                            >
                                ➕ Set Fee Structure
                            </button>
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {feeStructures.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">💰</div>
                                <p className="text-purple-400 font-medium">
                                    No fee structures found
                                </p>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fee Item</th>
                                        <th>Class</th>
                                        <th>Term</th>
                                        <th>Session</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStructures.map((structure) => (
                                        <tr key={structure.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {structure.item_name}
                                                    </p>
                                                    {structure.is_result_fee && (
                                                        <span className="badge-purple text-xs">
                                                            Result Fee
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-purple-600 text-sm">
                                                {structure.class_name}
                                            </td>
                                            <td className="text-purple-600 text-sm">
                                                {structure.term_name}
                                            </td>
                                            <td className="text-purple-600 text-sm">
                                                {structure.session_name}
                                            </td>
                                            <td>
                                                <span className="font-bold text-purple-900">
                                                    ₦{parseFloat(structure.amount).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* GENERATE INVOICES TAB */}
            {activeTab === 'invoices' && (
                <div className="card">
                    <h2 className="section-title mb-2">Generate Invoices</h2>
                    <p className="text-purple-400 text-sm mb-6">
                        Generate invoices for all students in a class
                        for a specific term. Students without invoices
                        will have theirs created automatically.
                    </p>

                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setInvoiceMode('bulk')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                invoiceMode === 'bulk'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-purple-600 border border-purple-200'
                            }`}
                        >
                            Whole Class
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceMode('single')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                invoiceMode === 'single'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-purple-600 border border-purple-200'
                            }`}
                        >
                            Single Student
                        </button>
                    </div>

                    {invoiceMode === 'single' && (
                        <div className="form-group mb-6">
                            <label className="form-label">Search Student <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter name or admission number"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudentForInvoice())}
                                />
                                <button
                                    type="button"
                                    onClick={searchStudentForInvoice}
                                    disabled={searchingStudent}
                                    className="btn-primary px-4 whitespace-nowrap"
                                >
                                    {searchingStudent ? '...' : 'Search'}
                                </button>
                            </div>
                            {foundStudent && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-3 flex items-center gap-3">
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
                        </div>
                    )}

                    {(invoiceMode === 'bulk' || foundStudent) && (
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        <div className="form-group">
                            <label className="form-label">Session</label>
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Select session</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Term</label>
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
                        </div>
                        <div className="form-group">
                            <label className="form-label">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Select class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    )}

                    {invoiceMode === 'bulk' && (
                        <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
                            <p className="text-purple-700 text-sm font-medium mb-2">
                                What this will do:
                            </p>
                            <ul className="text-purple-500 text-sm space-y-1">
                                <li>✓ Load all fee structures for selected class and term</li>
                                <li>✓ Find all enrolled students in selected class</li>
                                <li>✓ Generate one invoice per student</li>
                                <li>✓ Skip students who already have invoices</li>
                            </ul>
                        </div>
                    )}

                    {invoiceMode === 'bulk' && (
                        <button
                            onClick={() => {
                                if (!selectedClass || !selectedSession || !selectedTerm) {
                                    toast.error('Please select class, session and term.');
                                    return;
                                }
                                bulkInvoiceMutation.mutate({
                                    class_id: selectedClass,
                                    session_id: selectedSession,
                                    term_id: selectedTerm
                                });
                            }}
                            disabled={bulkInvoiceMutation.isPending}
                            className="btn-primary"
                        >
                            {bulkInvoiceMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </span>
                            ) : (
                                '🧾 Generate Invoices for Class'
                            )}
                        </button>
                    )}

                    {invoiceMode === 'single' && (
                        <button
                            onClick={() => {
                                if (!foundStudent || !selectedClass || !selectedSession || !selectedTerm) {
                                    toast.error('Please search a student and select class, session and term.');
                                    return;
                                }
                                singleInvoiceMutation.mutate({
                                    student_id: foundStudent.id,
                                    class_id: selectedClass,
                                    session_id: selectedSession,
                                    term_id: selectedTerm
                                });
                            }}
                            disabled={singleInvoiceMutation.isPending}
                            className="btn-primary"
                        >
                            {singleInvoiceMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </span>
                            ) : (
                                '🧾 Generate Invoice for Student'
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* OUTSTANDING TAB */}
            {activeTab === 'outstanding' && (
                <div className="space-y-4">
                <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                            className="input-field"
                    >
                            <option value="">All Sessions</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                    ))          }
                    </select>
                    <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                            className="input-field"
                    >
                            <option value="">All Terms</option>
                            {terms.map((t) => (
                                <option key={t.id} value={t.id}>{t.term_name}</option>
                    ))      }
                    </select>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                            className="input-field"
                    >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))  }
                    </select>
            </div>
        </div>

        <div className="card p-0 overflow-hidden">
            {loadingOutstanding ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : outstanding.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-purple-400 font-medium">
                        No outstanding payments found
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Invoice No.</th>
                                <th>Total Amount</th>
                                <th>Amount Paid</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outstanding.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td>
                                        <div>
                                            <p className="font-medium text-purple-900 text-sm">
                                                {invoice.first_name} {invoice.last_name}
                                            </p>
                                            <p className="text-purple-400 text-xs">
                                                {invoice.admission_number}
                                            </p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                            {invoice.invoice_number}
                                        </span>
                                    </td>
                                    <td className="font-medium text-purple-900">
                                        ₦{parseFloat(invoice.total_amount).toLocaleString()}
                                    </td>
                                    <td className="text-green-600 font-medium">
                                        ₦{parseFloat(invoice.total_paid).toLocaleString()}
                                    </td>
                                    <td className="text-red-600 font-bold">
                                        ₦{parseFloat(invoice.balance).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                            invoice.invoice_status === 'unpaid'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {invoice.invoice_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
)}

            {/* ADD FEE ITEM MODAL */}
            {showAddItemModal && (
                <AddFeeItemModal
                    onClose={() => setShowAddItemModal(false)}
                    onSuccess={() => {
                        setShowAddItemModal(false);
                        queryClient.invalidateQueries(['fee-items']);
                    }}
                />
            )}

            {/* SET FEE STRUCTURE MODAL */}
            {showSetStructureModal && (
                <SetFeeStructureModal
                    feeItems={feeItems}
                    classes={classes}
                    sessions={sessions}
                    terms={terms}
                    onClose={() => setShowSetStructureModal(false)}
                    onSuccess={() => {
                        setShowSetStructureModal(false);
                        queryClient.invalidateQueries(['fee-structures']);
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// ADD FEE ITEM MODAL
// ============================================
const AddFeeItemModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        item_name: '',
        item_code: '',
        description: '',
        is_result_fee: false
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/fees/items', data);
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
        if (!form.item_name || !form.item_code) {
            toast.error('Item name and code are required.');
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
                        Add Fee Item
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Item Name <span className="text-red-500">*</span></label>
                        <input
                            value={form.item_name}
                            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                            className="input-field"
                            placeholder="e.g., School Fees"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Item Code <span className="text-red-500">*</span></label>
                        <input
                            value={form.item_code}
                            onChange={(e) => setForm({ ...form, item_code: e.target.value.toUpperCase() })}
                            className="input-field"
                            placeholder="e.g., SCH-FEE"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input-field"
                            placeholder="Optional description"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_result_fee}
                            onChange={(e) => setForm({ ...form, is_result_fee: e.target.checked })}
                            className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-purple-700 text-sm font-medium">
                            This is the result checking fee
                        </span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Add Fee Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ============================================
// SET FEE STRUCTURE MODAL
// ============================================
const SetFeeStructureModal = ({ feeItems, classes, sessions, terms, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        fee_item_id: '',
        class_id: '',
        session_id: '',
        term_id: '',
        amount: ''
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/fees/structures', data);
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
        if (!form.fee_item_id || !form.class_id || !form.session_id || !form.term_id || !form.amount) {
            toast.error('All fields are required.');
            return;
        }
        mutation.mutate({ ...form, amount: parseFloat(form.amount) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Set Fee Structure
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="form-group">
                        <label className="form-label">Fee Item <span className="text-red-500">*</span></label>
                        <select
                            value={form.fee_item_id}
                            onChange={(e) => setForm({ ...form, fee_item_id: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Select fee item</option>
                            {feeItems.map((item) => (
                                <option key={item.id} value={item.id}>{item.item_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class <span className="text-red-500">*</span></label>
                        <select
                            value={form.class_id}
                            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Select class</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Session <span className="text-red-500">*</span></label>
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
                            <label className="form-label">Term <span className="text-red-500">*</span></label>
                            <select
                                value={form.term_id}
                                onChange={(e) => setForm({ ...form, term_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select term</option>
                                {terms.map((t) => (
                                    <option key={t.id} value={t.id}>{t.term_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amount (₦) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="0"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="input-field"
                            placeholder="e.g., 15000"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Saving...' : 'Set Structure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeesPage;