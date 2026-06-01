import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const AuditPage = () => {
    const [moduleFilter, setModuleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    // FETCH AUDIT LOGS
    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', moduleFilter, page, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (moduleFilter) params.append('module', moduleFilter);
            if (search) params.append('search', search);
            params.append('page', page);
            params.append('limit', 20);
            const res = await api.get(`/admin/audit-logs?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const logs = data?.data ?? [];
    const pagination = data?.pagination ?? {};

    const modules = [
        'auth', 'students', 'teachers', 'classes',
        'subjects', 'scores', 'attendance', 'fees',
        'invoices', 'payments', 'results', 'cbt',
        'library', 'calendar', 'promotions', 'settings', 'system'
    ];

    const moduleColors = {
        auth: 'bg-blue-100 text-blue-700',
        students: 'bg-purple-100 text-purple-700',
        teachers: 'bg-violet-100 text-violet-700',
        scores: 'bg-green-100 text-green-700',
        attendance: 'bg-yellow-100 text-yellow-700',
        fees: 'bg-orange-100 text-orange-700',
        payments: 'bg-red-100 text-red-700',
        cbt: 'bg-pink-100 text-pink-700',
        library: 'bg-teal-100 text-teal-700',
        calendar: 'bg-indigo-100 text-indigo-700',
        promotions: 'bg-emerald-100 text-emerald-700',
        system: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="page-title">Audit Logs</h1>
                <p className="text-purple-400 text-sm mt-1">
                    Complete record of all actions taken in the system
                </p>
            </div>

            {/* INFO */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex gap-3">
                    <span className="text-xl">🔍</span>
                    <p className="text-blue-600 text-sm">
                        Every action performed in the system is recorded here.
                        This includes logins, score entries, payment approvals,
                        and all administrative actions.
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Search by action or description..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input-field"
                    />
                    <select
                        value={moduleFilter}
                        onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                        className="input-field"
                    >
                        <option value="">All Modules</option>
                        {modules.map((m) => (
                            <option key={m} value={m} className="capitalize">
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* LOGS TABLE */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-purple-400 font-medium">No logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Module</th>
                                    <th>Action</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="text-purple-500 text-xs whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleDateString('en-NG', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                            <br />
                                            {new Date(log.created_at).toLocaleTimeString('en-NG', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                            <p className="text-purple-900 text-sm font-medium">
                                                {log.user_role?.replace('_', ' ') || 'System'}
                                            </p>
                                            <p className="text-purple-400 text-xs">
                                                {log.ip_address || 'N/A'}
                                            </p>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                                moduleColors[log.module] || 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {log.module}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <p className="text-purple-600 text-sm max-w-xs truncate">
                                                {log.description || 'No description'}
                                            </p>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                log.status === 'success'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {log.status}
                                            </span>
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
        </div>
    );
};

export default AuditPage;