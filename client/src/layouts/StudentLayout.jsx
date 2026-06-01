import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentTopbar from '../components/student/StudentTopbar';

const StudentLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8f7ff] flex">
            <StudentSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <StudentTopbar
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;