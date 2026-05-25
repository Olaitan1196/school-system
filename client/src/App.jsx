import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// PUBLIC PAGES
import LandingPage from './pages/public/LandingPage';
import PublicExamPage from './pages/public/PublicExamPage';
import ResultCheckPage from './pages/public/ResultCheckPage';
import ExamAccessPage from './pages/public/ExamAccessPage';

// AUTH PAGES
import AdminLoginPage from './pages/auth/AdminLoginPage';
import TeacherLoginPage from './pages/auth/TeacherLoginPage';
import StudentLoginPage from './pages/auth/StudentLoginPage';

// ADMIN PAGES
import AdminDashboard from './pages/admin/AdminDashboard';

// TEACHER PAGES
import TeacherDashboard from './pages/teacher/TeacherDashboard';

// STUDENT PAGES
import StudentDashboard from './pages/student/StudentDashboard';

// LAYOUTS
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// PROTECTED ROUTE COMPONENT
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-primary-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login/admin" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const App = () => {
    return (
        <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/result" element={<ResultCheckPage />} />
            <Route path="/exam-access" element={<ExamAccessPage />} />
            <Route path="/practice-exams" element={<PublicExamPage />} />

            {/* AUTH ROUTES */}
            <Route path="/login/admin" element={<AdminLoginPage />} />
            <Route path="/login/teacher" element={<TeacherLoginPage />} />
            <Route path="/login/student" element={<StudentLoginPage />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminDashboard />} />
            </Route>

            {/* TEACHER ROUTES */}
            <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['class_teacher', 'subject_teacher']}>
                    <TeacherLayout />
                </ProtectedRoute>
            }>
                <Route index element={<TeacherDashboard />} />
            </Route>

            {/* STUDENT ROUTES */}
            <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentLayout />
                </ProtectedRoute>
            }>
                <Route index element={<StudentDashboard />} />
            </Route>

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;