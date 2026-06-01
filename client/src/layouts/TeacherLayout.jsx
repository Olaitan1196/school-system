import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherTopbar from '../components/teacher/TeacherTopbar';

const TeacherLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8f7ff] flex">

            <TeacherSidebar
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
                <TeacherTopbar
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;