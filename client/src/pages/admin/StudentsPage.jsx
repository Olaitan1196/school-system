import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AddStudentModal from '../../components/admin/AddStudentModal';
import StudentDetailModal from '../../components/admin/StudentDetailModal';

const StudentsPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // FETCH STUDENTS
    const { data, isLoading } = useQuery({
        queryKey: ['students', search, genderFilter, statusFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (genderFilter) params.append('gender', genderFilter);
            if (statusFilter) params.append('is_active', statusFilter);
            params.append('page', page);
            params.append('limit', 15);
            const res = await api.get(`/students?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    // TOGGLE STATUS MUTATION
    const toggleStatusMutation = useMutation({
        mutationFn: async (studentId) => {
            const res = await api.patch(`/students/${studentId}/toggle-status`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['students']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Action failed.');
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: async (studentId) => {
            const res = await api.delete(`/students/${studentId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['students']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Delete failed.');
        }
    });

    const students = data?.data ?? [];
    const pagination = data?.pagination ?? {};

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        {pagination.total ?? 0} total students
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <span>➕</span>
                    Add New Student
                </button>
            </div>

            {/* FILTERS */}
            <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or admission number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input-field"
                    />
                    <select
                        value={genderFilter}
                        onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                        className="input-field"
                    >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input-field"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🎓</div>
                        <p className="text-purple-400 font-medium">No students found</p>
                        <p className="text-purple-300 text-sm mt-1">
                            Try adjusting your search or add a new student
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Admission No.</th>
                                    <th>Class</th>
                                    <th>Gender</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                    {student.passport_url ? (
                                                        <img
                                                            src={student.passport_url}
                                                            alt={student.first_name}
                                                            className="w-9 h-9 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-purple-600 font-bold text-sm">
                                                            {student.first_name?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {student.first_name} {student.last_name}
                                                    </p>
                                                    <p className="text-purple-400 text-xs">
                                                        {student.email || student.phone || 'No contact'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                {student.admission_number}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-purple-700">
                                                {student.class_name
                                                    ? `${student.class_name}${student.stream_name ? ` (${student.stream_name})` : ''}`
                                                    : 'Not enrolled'
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                student.gender === 'Male'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-pink-100 text-pink-700'
                                            }`}>
                                                {student.gender || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                student.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors font-medium"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => toggleStatusMutation.mutate(student.id)}
                                                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                                                        student.is_active
                                                            ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                                            : 'bg-green-50 hover:bg-green-100 text-green-600'
                                                    }`}
                                                >
                                                    {student.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${student.first_name} ${student.last_name}? This cannot be undone.`)) {
                                                            deleteStudentMutation.mutate(student.id);
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                                                >
                                                    Delete
                                                </button>
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
                                className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={pagination.page >= pagination.total_pages}
                                className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD STUDENT MODAL */}
            {showAddModal && (
                <AddStudentModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        queryClient.invalidateQueries(['students']);
                    }}
                />
            )}

            {/* STUDENT DETAIL MODAL */}
            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    onUpdate={() => queryClient.invalidateQueries(['students'])}
                />
            )}
        </div>
    );
};

export default StudentsPage;