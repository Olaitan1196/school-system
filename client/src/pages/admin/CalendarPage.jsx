import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CalendarPage = () => {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [sessionFilter, setSessionFilter] = useState('');
    const [termFilter, setTermFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // FETCH EVENTS
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['calendar-events', sessionFilter, termFilter, typeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (sessionFilter) params.append('session_id', sessionFilter);
            if (termFilter) params.append('term_id', termFilter);
            if (typeFilter) params.append('event_type', typeFilter);
            const res = await api.get(`/calendar?${params}`);
            return res.data;
        }
    });

    // FETCH UPCOMING EVENTS
    const { data: upcomingData } = useQuery({
        queryKey: ['upcoming-events'],
        queryFn: async () => {
            const res = await api.get('/calendar/upcoming?limit=5');
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

    // DELETE EVENT
    const deleteMutation = useMutation({
        mutationFn: async (eventId) => {
            const res = await api.delete(`/calendar/${eventId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['calendar-events']);
            queryClient.invalidateQueries(['upcoming-events']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed.');
        }
    });

    const events = eventsData?.data ?? [];
    const upcoming = upcomingData?.data ?? [];
    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];

    const eventTypeColors = {
        resumption: 'bg-green-100 text-green-700 border-green-200',
        closing: 'bg-red-100 text-red-700 border-red-200',
        holiday: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        examination: 'bg-blue-100 text-blue-700 border-blue-200',
        cbt: 'bg-purple-100 text-purple-700 border-purple-200',
        sports: 'bg-orange-100 text-orange-700 border-orange-200',
        cultural: 'bg-pink-100 text-pink-700 border-pink-200',
        meeting: 'bg-gray-100 text-gray-700 border-gray-200',
        excursion: 'bg-teal-100 text-teal-700 border-teal-200',
        result_day: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        promotion_day: 'bg-violet-100 text-violet-700 border-violet-200',
        other: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const eventTypeIcons = {
        resumption: '🏫',
        closing: '🔒',
        holiday: '🎉',
        examination: '📝',
        cbt: '💻',
        sports: '⚽',
        cultural: '🎭',
        meeting: '👥',
        excursion: '🚌',
        result_day: '📊',
        promotion_day: '🏆',
        other: '📌',
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Academic Calendar</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Manage school events, holidays and important dates
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary text-sm self-start sm:self-auto"
                >
                    ➕ Add Event
                </button>
            </div>

            {/* UPCOMING EVENTS BANNER */}
            {upcoming.length > 0 && (
                <div className="card bg-gradient-to-r from-purple-900 to-purple-800 border-0">
                    <h3 className="text-white font-semibold text-sm mb-3">
                        📅 Upcoming Events
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {upcoming.map((event) => (
                            <div key={event.id}
                                className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                                <span className="text-base">
                                    {eventTypeIcons[event.event_type]}
                                </span>
                                <div>
                                    <p className="text-white text-xs font-medium">
                                        {event.event_title}
                                    </p>
                                    <p className="text-purple-300 text-xs">
                                        {new Date(event.event_date).toLocaleDateString('en-NG', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FILTERS */}
            <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select
                        value={sessionFilter}
                        onChange={(e) => setSessionFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Sessions</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>{s.session_name}</option>
                        ))}
                    </select>
                    <select
                        value={termFilter}
                        onChange={(e) => setTermFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Terms</option>
                        {terms.map((t) => (
                            <option key={t.id} value={t.id}>{t.term_name}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Types</option>
                        {Object.keys(eventTypeIcons).map((type) => (
                            <option key={type} value={type}>
                                {eventTypeIcons[type]} {type.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* EVENTS LIST */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🗓️</div>
                        <p className="text-purple-400 font-medium">No events found</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary mt-4"
                        >
                            Add First Event
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>End Date</th>
                                    <th>Session</th>
                                    <th>Visibility</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">
                                                    {eventTypeIcons[event.event_type]}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-purple-900 text-sm">
                                                        {event.event_title}
                                                    </p>
                                                    {event.event_description && (
                                                        <p className="text-purple-400 text-xs truncate max-w-xs">
                                                            {event.event_description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize border ${
                                                eventTypeColors[event.event_type]
                                            }`}>
                                                {event.event_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-purple-700 font-medium text-sm">
                                            {new Date(event.event_date).toLocaleDateString('en-NG', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="text-purple-500 text-sm">
                                            {event.end_date
                                                ? new Date(event.end_date).toLocaleDateString('en-NG', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '—'
                                            }
                                        </td>
                                        <td className="text-purple-500 text-sm">
                                            {event.session_name || '—'}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                event.is_public
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {event.is_public ? 'Public' : 'Internal'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this event?')) {
                                                            deleteMutation.mutate(event.id);
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
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
            </div>

            {/* ADD EVENT MODAL */}
            {showAddModal && (
                <EventModal
                    sessions={sessions}
                    terms={terms}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        queryClient.invalidateQueries(['calendar-events']);
                        queryClient.invalidateQueries(['upcoming-events']);
                    }}
                />
            )}

            {/* EDIT EVENT MODAL */}
            {showEditModal && selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    sessions={sessions}
                    terms={terms}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedEvent(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setSelectedEvent(null);
                        queryClient.invalidateQueries(['calendar-events']);
                        queryClient.invalidateQueries(['upcoming-events']);
                    }}
                />
            )}
        </div>
    );
};


// ============================================
// EVENT MODAL (ADD AND EDIT)
// ============================================
const EventModal = ({ event, sessions, terms, onClose, onSuccess }) => {
    const isEditing = !!event;
    const [form, setForm] = useState({
        session_id: event?.session_id || '',
        term_id: event?.term_id || '',
        event_title: event?.event_title || '',
        event_type: event?.event_type || 'other',
        event_date: event?.event_date?.split('T')[0] || '',
        end_date: event?.end_date?.split('T')[0] || '',
        event_description: event?.event_description || '',
        is_school_wide: event?.is_school_wide ?? true,
        is_public: event?.is_public ?? false,
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing) {
                const res = await api.put(`/calendar/${event.id}`, data);
                return res.data;
            } else {
                const res = await api.post('/calendar', data);
                return res.data;
            }
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
        if (!form.session_id || !form.event_title || !form.event_type || !form.event_date) {
            toast.error('Session, title, type and date are required.');
            return;
        }
        mutation.mutate({
            ...form,
            end_date: form.end_date || null,
            term_id: form.term_id || null
        });
    };

    const eventTypes = [
        { value: 'resumption', label: '🏫 Resumption' },
        { value: 'closing', label: '🔒 Closing' },
        { value: 'holiday', label: '🎉 Holiday' },
        { value: 'examination', label: '📝 Examination' },
        { value: 'cbt', label: '💻 CBT' },
        { value: 'sports', label: '⚽ Sports' },
        { value: 'cultural', label: '🎭 Cultural' },
        { value: 'meeting', label: '👥 Meeting' },
        { value: 'excursion', label: '🚌 Excursion' },
        { value: 'result_day', label: '📊 Result Day' },
        { value: 'promotion_day', label: '🏆 Promotion Day' },
        { value: 'other', label: '📌 Other' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-purple-950"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {isEditing ? 'Edit Event' : 'Add Calendar Event'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="form-group">
                        <label className="form-label">
                            Event Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.event_title}
                            onChange={(e) => setForm({ ...form, event_title: e.target.value })}
                            className="input-field"
                            placeholder="e.g., First Term Resumption"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Event Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {eventTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, event_type: type.value })}
                                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all text-left ${
                                        form.event_type === type.value
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">
                                Session <span className="text-red-500">*</span>
                            </label>
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
                            <label className="form-label">Term</label>
                            <select
                                value={form.term_id}
                                onChange={(e) => setForm({ ...form, term_id: e.target.value })}
                                className="input-field"
                            >
                                <option value="">All Terms</option>
                                {terms.map((t) => (
                                    <option key={t.id} value={t.id}>{t.term_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.event_date}
                                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                className="input-field"
                            />
                            <p className="text-purple-400 text-xs mt-1">
                                Leave blank for single day event
                            </p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            value={form.event_description}
                            onChange={(e) => setForm({ ...form, event_description: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Optional event description"
                        />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_school_wide}
                                onChange={(e) => setForm({ ...form, is_school_wide: e.target.checked })}
                                className="w-4 h-4 accent-purple-600"
                            />
                            <span className="text-purple-700 text-sm font-medium">
                                School wide event
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_public}
                                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                                className="w-4 h-4 accent-purple-600"
                            />
                            <span className="text-purple-700 text-sm font-medium">
                                Show on public portal
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="btn-primary">
                            {mutation.isPending
                                ? 'Saving...'
                                : isEditing ? 'Update Event' : 'Add Event'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CalendarPage;