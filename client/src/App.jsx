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
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ClassesPage from './pages/admin/ClassesPage';
import ScoresPage from "./pages/admin/ScoresPage";
import AttendancePage from './pages/admin/AttendancePage';
import FeesPage from './pages/admin/FeesPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import CBTPage from './pages/admin/CBTPage';
import AdminExamAccessPage from './pages/admin/AdminExamAccessPage';
import LibraryPage from './pages/admin/LibraryPage';
import CalendarPage from './pages/admin/CalendarPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditPage from './pages/admin/AuditPage';
// LAYOUTS
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// TEACHER PAGES
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassesPage from './pages/teacher/TeacherClassesPage';
import TeacherScoresPage from './pages/teacher/TeacherScoresPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherQuestionsPage from './pages/teacher/TeacherQuestionsPage';
import TeacherSettingsPage from './pages/teacher/TeacherSettingsPage';

// STUDENT PAGES
import StudentDashboard from './pages/student/StudentDashboard';
import StudentResultsPage from './pages/student/StudentResultsPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentInvoicePage from './pages/student/StudentInvoicePage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';
import CBTLoginPage from './pages/public/CBTLoginPage';
import CBTExamPage from './pages/student/CBTExamPage';

// PLACEHOLDER COMPONENT
const ComingSoon = ({ page }) => (
    <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-purple-900 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {page}
            </h2>
            <p className="text-purple-400">This page is coming soon.</p>
        </div>
    </div>
);

// PROTECTED ROUTE
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-purple-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-600 font-medium">Loading...</p>
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
            <Route path="/cbt-login" element={<CBTLoginPage />} />
            <Route path="/cbt-exam" element={<CBTExamPage />} />

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
                <Route path="students" element={<StudentsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="/admin/scores" element={<ScoresPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="promotions" element={<PromotionsPage />} />
                <Route path="fees" element={<FeesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="cbt" element={<CBTPage />} />
                <Route path="exam-access" element={<AdminExamAccessPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit" element={<AuditPage />} />
            </Route>

            {/* TEACHER ROUTES */}
            <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['class_teacher', 'subject_teacher']}>
                    <TeacherLayout />
                </ProtectedRoute>
            }>
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClassesPage />} />
                <Route path="scores" element={<TeacherScoresPage />} />
                <Route path="attendance" element={<TeacherAttendancePage />} />
                <Route path="questions" element={<TeacherQuestionsPage />} />
                <Route path="library" element={<ComingSoon page="Library" />} />
                <Route path="calendar" element={<ComingSoon page="Calendar" />} />
                <Route path="settings" element={<TeacherSettingsPage />} />
            </Route>

            {/* STUDENT ROUTES */}
            <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentLayout />
                </ProtectedRoute>
            }>
                <Route index element={<StudentDashboard />} />
                    <Route path="results" element={<StudentResultsPage />} />
                    <Route path="attendance" element={<StudentAttendancePage />} />
                    <Route path="invoice" element={<StudentInvoicePage />} />
                    <Route path="library" element={<ComingSoon page="Library" />} />
                    <Route path="calendar" element={<ComingSoon page="Calendar" />} />
                    <Route path="settings" element={<StudentSettingsPage />} />
            </Route>

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;