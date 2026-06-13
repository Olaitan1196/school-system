import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import NetworkInfoBar from '../components/admin/NetworkInfoBar';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8f7ff] flex">

            {/* SIDEBAR */}
            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* OVERLAY for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

                {/* NETWORK INFO BAR — only shows in Electron */}
                <NetworkInfoBar />

                {/* TOPBAR */}
                <AdminTopbar
                    onMenuClick={() => setSidebarOpen(true)}
                />

                {/* PAGE CONTENT */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;