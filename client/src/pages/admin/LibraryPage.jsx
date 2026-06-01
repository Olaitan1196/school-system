import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LibraryPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('books');
    const [search, setSearch] = useState('');
    const [bookTypeFilter, setBookTypeFilter] = useState('');
    const [classLevelFilter, setClassLevelFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [borrowStatusFilter, setBorrowStatusFilter] = useState('borrowed');

    // FETCH BOOKS
    const { data: booksData, isLoading: loadingBooks } = useQuery({
        queryKey: ['library-books', search, bookTypeFilter, classLevelFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (bookTypeFilter) params.append('book_type', bookTypeFilter);
            if (classLevelFilter) params.append('class_level', classLevelFilter);
            params.append('page', page);
            params.append('limit', 15);
            const res = await api.get(`/library?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    // FETCH BORROWINGS
    const { data: borrowingsData, isLoading: loadingBorrowings } = useQuery({
        queryKey: ['borrowings', borrowStatusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (borrowStatusFilter) params.append('borrow_status', borrowStatusFilter);
            params.append('limit', 20);
            const res = await api.get(`/library/borrowings?${params}`);
            return res.data;
        },
        enabled: activeTab === 'borrowings'
    });

    // FETCH OVERDUE BOOKS
    const { data: overdueData } = useQuery({
        queryKey: ['overdue-books'],
        queryFn: async () => {
            const res = await api.get('/library/overdue');
            return res.data;
        },
        enabled: activeTab === 'overdue'
    });

    // RETURN BOOK MUTATION
    const returnMutation = useMutation({
        mutationFn: async ({ borrowingId, data }) => {
            const res = await api.patch(
                `/library/borrowings/${borrowingId}/return`,
                data
            );
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['borrowings']);
            queryClient.invalidateQueries(['overdue-books']);
            queryClient.invalidateQueries(['library-books']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const books = booksData?.data ?? [];
    const booksPagination = booksData?.pagination ?? {};
    const borrowings = borrowingsData?.data ?? [];
    const overdue = overdueData?.data ?? [];

    const tabs = [
        { id: 'books', label: 'All Books', icon: '📚' },
        { id: 'borrowings', label: 'Borrowings', icon: '📖' },
        { id: 'overdue', label: 'Overdue', icon: '⚠️' },
    ];

    const bookTypeColors = {
        physical: 'bg-blue-100 text-blue-700',
        ebook: 'bg-green-100 text-green-700',
        both: 'bg-purple-100 text-purple-700',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Library</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Manage books, borrowings and the eLibrary
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'books' && (
                        <button
                            onClick={() => setShowAddBookModal(true)}
                            className="btn-primary text-sm"
                        >
                            ➕ Add Book
                        </button>
                    )}
                    {activeTab === 'borrowings' && (
                        <button
                            onClick={() => setShowBorrowModal(true)}
                            className="btn-primary text-sm"
                        >
                            📖 Issue Book
                        </button>
                    )}
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
                        {tab.id === 'overdue' && overdue.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {overdue.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* BOOKS TAB */}
            {activeTab === 'books' && (
                <div className="space-y-4">
                    <div className="card">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Search by title, author or ISBN..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="input-field"
                            />
                            <select
                                value={bookTypeFilter}
                                onChange={(e) => { setBookTypeFilter(e.target.value); setPage(1); }}
                                className="input-field"
                            >
                                <option value="">All Types</option>
                                <option value="physical">Physical Books</option>
                                <option value="ebook">eBooks</option>
                                <option value="both">Both</option>
                            </select>
                            <select
                                value={classLevelFilter}
                                onChange={(e) => { setClassLevelFilter(e.target.value); setPage(1); }}
                                className="input-field"
                            >
                                <option value="">All Levels</option>
                                <option value="JSS">JSS</option>
                                <option value="SSS">SSS</option>
                                <option value="Both">Both</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {loadingBooks ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : books.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">📚</div>
                                <p className="text-purple-400 font-medium">No books found</p>
                                <button
                                    onClick={() => setShowAddBookModal(true)}
                                    className="btn-primary mt-4"
                                >
                                    Add First Book
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Book</th>
                                            <th>Author</th>
                                            <th>Category</th>
                                            <th>Type</th>
                                            <th>Level</th>
                                            <th>Copies</th>
                                            <th>Available</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map((book) => (
                                            <tr key={book.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            {book.cover_image_url ? (
                                                                <img
                                                                    src={book.cover_image_url}
                                                                    alt={book.title}
                                                                    className="w-9 h-12 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-purple-400 text-lg">📖</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-purple-900 text-sm">
                                                                {book.title}
                                                            </p>
                                                            {book.isbn && (
                                                                <p className="text-purple-400 text-xs">
                                                                    ISBN: {book.isbn}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {book.author || 'N/A'}
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {book.category || 'N/A'}
                                                </td>
                                                <td>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                        bookTypeColors[book.book_type]
                                                    }`}>
                                                        {book.book_type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                                                        {book.class_level}
                                                    </span>
                                                </td>
                                                <td className="text-purple-700 font-medium text-sm">
                                                    {book.total_copies}
                                                </td>
                                                <td>
                                                    <span className={`font-bold text-sm ${
                                                        book.available_copies === 0
                                                            ? 'text-red-600'
                                                            : book.available_copies <= 2
                                                            ? 'text-yellow-600'
                                                            : 'text-green-600'
                                                    }`}>
                                                        {book.available_copies}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {book.book_type !== 'ebook' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBook(book);
                                                                    setShowBorrowModal(true);
                                                                }}
                                                                disabled={book.available_copies === 0}
                                                                className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                Issue
                                                            </button>
                                                        )}
                                                        {book.file_url && (
                                                            <a
                                                                href={book.file_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                                            >
                                                                Read
                                                            </a>
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
                        {booksPagination.total_pages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                <p className="text-sm text-purple-400">
                                    Page {booksPagination.page} of {booksPagination.total_pages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={booksPagination.page <= 1}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={booksPagination.page >= booksPagination.total_pages}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BORROWINGS TAB */}
            {activeTab === 'borrowings' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'borrowed', label: 'Active' },
                            { value: 'returned', label: 'Returned' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'lost', label: 'Lost' },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setBorrowStatusFilter(f.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    borrowStatusFilter === f.value
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {loadingBorrowings ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : borrowings.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">📖</div>
                                <p className="text-purple-400 font-medium">No borrowings found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Book</th>
                                            <th>Borrower</th>
                                            <th>Type</th>
                                            <th>Borrowed</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {borrowings.map((b) => (
                                            <tr key={b.id}>
                                                <td>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {b.title}
                                                    </p>
                                                    <p className="text-purple-400 text-xs">
                                                        {b.author}
                                                    </p>
                                                </td>
                                                <td>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {b.borrower_type === 'student'
                                                            ? `${b.student_first_name} ${b.student_last_name}`
                                                            : `${b.teacher_first_name} ${b.teacher_last_name}`
                                                        }
                                                    </p>
                                                    <p className="text-purple-400 text-xs">
                                                        {b.borrower_type === 'student'
                                                            ? b.admission_number
                                                            : b.staff_id
                                                        }
                                                    </p>
                                                </td>
                                                <td>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                        b.borrower_type === 'student'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {b.borrower_type}
                                                    </span>
                                                </td>
                                                <td className="text-purple-600 text-sm">
                                                    {new Date(b.borrowed_date).toLocaleDateString('en-NG')}
                                                </td>
                                                <td>
                                                    <span className={`text-sm font-medium ${
                                                        new Date(b.due_date) < new Date() && b.borrow_status === 'borrowed'
                                                            ? 'text-red-600'
                                                            : 'text-purple-600'
                                                    }`}>
                                                        {new Date(b.due_date).toLocaleDateString('en-NG')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                        b.borrow_status === 'returned'
                                                            ? 'bg-green-100 text-green-700'
                                                            : b.borrow_status === 'overdue'
                                                            ? 'bg-red-100 text-red-700'
                                                            : b.borrow_status === 'lost'
                                                            ? 'bg-gray-100 text-gray-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {b.borrow_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {b.borrow_status === 'borrowed' || b.borrow_status === 'overdue' ? (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Mark this book as returned?')) {
                                                                    returnMutation.mutate({
                                                                        borrowingId: b.id,
                                                                        data: {
                                                                            remarks: 'Book returned',
                                                                            fine_amount: 0
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                                        >
                                                            Return
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            {b.returned_date
                                                                ? new Date(b.returned_date).toLocaleDateString('en-NG')
                                                                : 'N/A'
                                                            }
                                                        </span>
                                                    )}
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

            {/* OVERDUE TAB */}
            {activeTab === 'overdue' && (
                <div className="card p-0 overflow-hidden">
                    {overdue.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">✅</div>
                            <p className="text-purple-400 font-medium">
                                No overdue books
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Book</th>
                                        <th>Borrower</th>
                                        <th>Due Date</th>
                                        <th>Days Overdue</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overdue.map((b) => (
                                        <tr key={b.id}>
                                            <td>
                                                <p className="font-medium text-purple-900 text-sm">
                                                    {b.title}
                                                </p>
                                            </td>
                                            <td>
                                                <p className="font-medium text-purple-900 text-sm">
                                                    {b.borrower_type === 'student'
                                                        ? `${b.student_first_name} ${b.student_last_name}`
                                                        : `${b.teacher_first_name} ${b.teacher_last_name}`
                                                    }
                                                </p>
                                            </td>
                                            <td className="text-red-600 text-sm font-medium">
                                                {new Date(b.due_date).toLocaleDateString('en-NG')}
                                            </td>
                                            <td>
                                                <span className="font-bold text-red-600">
                                                    {b.days_overdue} days
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Mark this book as returned?')) {
                                                            returnMutation.mutate({
                                                                borrowingId: b.id,
                                                                data: {
                                                                    remarks: 'Overdue book returned',
                                                                    fine_amount: b.days_overdue * 50
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
                                                >
                                                    Mark Returned
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ADD BOOK MODAL */}
            {showAddBookModal && (
                <AddBookModal
                    onClose={() => setShowAddBookModal(false)}
                    onSuccess={() => {
                        setShowAddBookModal(false);
                        queryClient.invalidateQueries(['library-books']);
                    }}
                />
            )}

            {/* BORROW BOOK MODAL */}
            {showBorrowModal && (
                <IssueBookModal
                    book={selectedBook}
                    onClose={() => {
                        setShowBorrowModal(false);
                        setSelectedBook(null);
                    }}
                    onSuccess={() => {
                        setShowBorrowModal(false);
                        setSelectedBook(null);
                        queryClient.invalidateQueries(['borrowings']);
                        queryClient.invalidateQueries(['library-books']);
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// ADD BOOK MODAL
// ============================================
const AddBookModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publication_year: '',
        edition: '',
        category: '',
        class_level: 'General',
        description: '',
        cover_image_url: '',
        file_url: '',
        book_type: 'physical',
        total_copies: 1
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/library', data);
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
        if (!form.title || !form.book_type) {
            toast.error('Title and book type are required.');
            return;
        }
        mutation.mutate({
            ...form,
            total_copies: parseInt(form.total_copies),
            publication_year: form.publication_year
                ? parseInt(form.publication_year)
                : null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Add Book to Library
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="form-group">
                        <label className="form-label">
                            Book Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="input-field"
                            placeholder="e.g., New General Mathematics JSS1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Author</label>
                            <input
                                value={form.author}
                                onChange={(e) => setForm({ ...form, author: e.target.value })}
                                className="input-field"
                                placeholder="e.g., M.F Macrae"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ISBN</label>
                            <input
                                value={form.isbn}
                                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                                className="input-field"
                                placeholder="e.g., 978-0-582-60439-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Publisher</label>
                            <input
                                value={form.publisher}
                                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                                className="input-field"
                                placeholder="e.g., Longman"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Publication Year</label>
                            <input
                                type="number"
                                value={form.publication_year}
                                onChange={(e) => setForm({ ...form, publication_year: e.target.value })}
                                className="input-field"
                                placeholder="e.g., 2020"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select category</option>
                                <option value="Textbook">Textbook</option>
                                <option value="Novel">Novel</option>
                                <option value="Reference">Reference</option>
                                <option value="Past Questions">Past Questions</option>
                                <option value="Dictionary">Dictionary</option>
                                <option value="Atlas">Atlas</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Class Level</label>
                            <select
                                value={form.class_level}
                                onChange={(e) => setForm({ ...form, class_level: e.target.value })}
                                className="input-field"
                            >
                                <option value="JSS">JSS</option>
                                <option value="SSS">SSS</option>
                                <option value="Both">Both</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Book Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'physical', label: '📗 Physical' },
                                { value: 'ebook', label: '💻 eBook' },
                                { value: 'both', label: '📚 Both' },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, book_type: type.value })}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        form.book_type === type.value
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(form.book_type === 'physical' || form.book_type === 'both') && (
                        <div className="form-group">
                            <label className="form-label">Number of Copies</label>
                            <input
                                type="number"
                                min="1"
                                value={form.total_copies}
                                onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    )}

                    {(form.book_type === 'ebook' || form.book_type === 'both') && (
                        <div className="form-group">
                            <label className="form-label">eBook File URL</label>
                            <input
                                value={form.file_url}
                                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                                className="input-field"
                                placeholder="https://link-to-ebook-file.pdf"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Cover Image URL</label>
                        <input
                            value={form.cover_image_url}
                            onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                            className="input-field"
                            placeholder="https://link-to-cover-image.jpg"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Brief description of the book"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Adding...' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ============================================
// ISSUE BOOK MODAL
// ============================================
const IssueBookModal = ({ book, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        borrower_type: 'student',
        borrower_id: '',
        due_date: ''
    });
    const [search, setSearch] = useState('');
    const [foundPerson, setFoundPerson] = useState(null);
    const [searching, setSearching] = useState(false);

    const searchPerson = async () => {
        if (!search) return;
        setSearching(true);
        try {
            const endpoint = form.borrower_type === 'student'
                ? `/students?search=${search}&limit=1`
                : `/teachers?search=${search}&limit=1`;

            const res = await api.get(endpoint);
            const data = res.data.data;

            if (data.length > 0) {
                const person = data[0];
                setFoundPerson(person);
                setForm({
                    ...form,
                    borrower_id: person.user_id || person.id
                });
            } else {
                toast.error(`${form.borrower_type} not found.`);
                setFoundPerson(null);
            }
        } catch (error) {
            toast.error('Search failed.');
        } finally {
            setSearching(false);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/library/borrow', data);
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
        if (!form.borrower_id || !form.due_date) {
            toast.error('Borrower and due date are required.');
            return;
        }
        mutation.mutate({
            book_id: book?.id,
            borrower_id: form.borrower_id,
            borrower_type: form.borrower_type,
            due_date: form.due_date
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Issue Book
                        </h2>
                        {book && (
                            <p className="text-purple-400 text-sm">{book.title}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="form-group">
                        <label className="form-label">Borrower Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['student', 'teacher'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setForm({ ...form, borrower_type: type, borrower_id: '' });
                                        setFoundPerson(null);
                                        setSearch('');
                                    }}
                                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                                        form.borrower_type === type
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {type === 'student' ? '🎓' : '👩‍🏫'} {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Search {form.borrower_type === 'student' ? 'Student' : 'Teacher'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-field"
                                placeholder={`Search by name or ${form.borrower_type === 'student' ? 'admission number' : 'staff ID'}`}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPerson())}
                            />
                            <button
                                type="button"
                                onClick={searchPerson}
                                disabled={searching}
                                className="btn-primary px-4"
                            >
                                {searching ? '...' : 'Find'}
                            </button>
                        </div>
                    </div>

                    {foundPerson && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-green-800 font-medium text-sm">
                                ✓ {foundPerson.first_name} {foundPerson.last_name}
                            </p>
                            <p className="text-green-600 text-xs">
                                {foundPerson.admission_number || foundPerson.staff_id}
                            </p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="input-field"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending ? 'Issuing...' : 'Issue Book'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LibraryPage;