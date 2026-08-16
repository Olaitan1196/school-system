import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CreateSessionModal from '../../components/admin/CreateSessionModal';
import CreateTermModal from '../../components/admin/CreateTermModal';
import CreateClassModal from '../../components/admin/CreateClassModal';
import CreateSubjectModal from '../../components/admin/CreateSubjectModal';
import AssignSubjectModal from '../../components/admin/AssignSubjectModal';
import EnrollStudentModal from '../../components/admin/EnrollStudentModal';

const ClassesPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('sessions');
    const [showModal, setShowModal] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

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

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    // FETCH SUBJECTS
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await api.get('/academic/subjects');
            return res.data;
        }
    });

    const sessions = sessionsData?.data ?? [];
    const terms = termsData?.data ?? [];
    const classes = classesData?.data ?? [];
    const subjects = subjectsData?.data ?? [];

    const tabs = [
        { id: 'sessions', label: 'Sessions', icon: '📆' },
        { id: 'terms', label: 'Terms', icon: '🗓️' },
        { id: 'classes', label: 'Classes', icon: '🏫' },
        { id: 'subjects', label: 'Subjects', icon: '📚' },
    ];

    const getModalTitle = () => {
        const titles = {
            session: 'Create Academic Session',
            term: 'Create Term',
            class: 'Create Class',
            subject: 'Create Subject',
            assign: 'Assign Subject to Class',
            enroll: 'Enroll Student'
        };
        return titles[showModal] || '';
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Classes & Subjects</h1>
                    <p className="text-purple-400 text-sm mt-1">
                        Manage academic sessions, terms, classes and subjects
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowModal('session')}
                        className="btn-secondary text-sm flex items-center gap-1"
                    >
                        ➕ Session
                    </button>
                    <button
                        onClick={() => setShowModal('term')}
                        className="btn-secondary text-sm flex items-center gap-1"
                    >
                        ➕ Term
                    </button>
                    <button
                        onClick={() => setShowModal('class')}
                        className="btn-secondary text-sm flex items-center gap-1"
                    >
                        ➕ Class
                    </button>
                    <button
                        onClick={() => setShowModal('subject')}
                        className="btn-primary text-sm flex items-center gap-1"
                    >
                        ➕ Subject
                    </button>
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

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
                <div className="card p-0 overflow-hidden">
                    {sessions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📆</div>
                            <p className="text-purple-400 font-medium">No sessions found</p>
                            <button
                                onClick={() => setShowModal('session')}
                                className="btn-primary mt-4"
                            >
                                Create First Session
                            </button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Session Name</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td className="font-medium text-purple-900">
                                            {session.session_name}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {new Date(session.start_date).toLocaleDateString('en-NG')}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {new Date(session.end_date).toLocaleDateString('en-NG')}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                session.is_current
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {session.is_current ? 'Current' : 'Past'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TERMS TAB */}
            {activeTab === 'terms' && (
                <div className="card p-0 overflow-hidden">
                    {terms.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">🗓️</div>
                            <p className="text-purple-400 font-medium">No terms found</p>
                            <button
                                onClick={() => setShowModal('term')}
                                className="btn-primary mt-4"
                            >
                                Create First Term
                            </button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Term Name</th>
                                    <th>Session</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {terms.map((term) => (
                                    <tr key={term.id}>
                                        <td className="font-medium text-purple-900">
                                            {term.term_name}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {term.session_name}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {new Date(term.start_date).toLocaleDateString('en-NG')}
                                        </td>
                                        <td className="text-purple-600 text-sm">
                                            {new Date(term.end_date).toLocaleDateString('en-NG')}
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                term.is_current
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {term.is_current ? 'Current' : 'Past'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* CLASSES TAB */}
            {activeTab === 'classes' && (
                <div className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowModal('assign')}
                            className="btn-secondary text-sm"
                        >
                            Assign Subject to Class
                        </button>
                        <button
                            onClick={() => setShowModal('enroll')}
                            className="btn-primary text-sm"
                        >
                            Enroll Student
                        </button>
                    </div>
                    {classes.length === 0 ? (
                        <div className="card text-center py-16">
                            <div className="text-5xl mb-3">🏫</div>
                            <p className="text-purple-400 font-medium">No classes found</p>
                            <button
                                onClick={() => setShowModal('class')}
                                className="btn-primary mt-4"
                            >
                                Create First Class
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.map((cls) => (
                                <div key={cls.id}
                                    className="card hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setSelectedClass(cls)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <span className="text-purple-700 font-bold text-sm">
                                                {cls.class_level}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            cls.class_level === 'JSS'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {cls.class_level}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-purple-900 mb-1"
                                        style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {cls.class_name}
                                    </h3>
                                    {cls.streams && cls.streams.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {cls.streams.map((stream) => (
                                                <span key={stream.id}
                                                    className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                                                    {stream.stream_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SUBJECTS TAB */}
            {activeTab === 'subjects' && (
                <div className="card p-0 overflow-hidden">
                    {subjects.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📚</div>
                            <p className="text-purple-400 font-medium">No subjects found</p>
                            <button
                                onClick={() => setShowModal('subject')}
                                className="btn-primary mt-4"
                            >
                                Create First Subject
                            </button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Subject Name</th>
                                    <th>Subject Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subject) => (
                                    <tr key={subject.id}>
                                        <td className="font-medium text-purple-900">
                                            {subject.subject_name}
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                {subject.subject_code}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* MODALS */}
            {showModal === 'session' && (
                <CreateSessionModal
                    onClose={() => setShowModal(null)}
                    onSuccess={() => {
                        setShowModal(null);
                        queryClient.invalidateQueries(['sessions']);
                    }}
                />
            )}
            {showModal === 'term' && (
                <CreateTermModal
                    sessions={sessions}
                    onClose={() => setShowModal(null)}
                    onSuccess={() => {
                        setShowModal(null);
                        queryClient.invalidateQueries(['terms']);
                    }}
                />
            )}
            {showModal === 'class' && (
                <CreateClassModal
                    onClose={() => setShowModal(null)}
                    onSuccess={() => {
                        setShowModal(null);
                        queryClient.invalidateQueries(['classes']);
                    }}
                />
            )}
            {showModal === 'subject' && (
                <CreateSubjectModal
                    onClose={() => setShowModal(null)}
                    onSuccess={() => {
                        setShowModal(null);
                        queryClient.invalidateQueries(['subjects']);
                    }}
                />
            )}
            {showModal === 'assign' && (
                <AssignSubjectModal
                    classes={classes}
                    subjects={subjects}
                    onClose={() => setShowModal(null)}
                    onSuccess={() => setShowModal(null)}
                />
            )}
            {showModal === 'enroll' && (
                <EnrollStudentModal
                    classes={classes}
                    sessions={sessions}
                    queryClient={queryClient}
                    onClose={() => setShowModal(null)}
                    onSuccess={() => setShowModal(null)}
                />
            )}
        </div>
    );
};

export default ClassesPage;