import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Zap, Bell } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout() {
  const { isAuthenticated, adminEmail } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-navy-950 flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-navy-900 border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-sm hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
              <div className="hidden md:flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">
                  {adminEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-black text-xs rounded-sm">
                DH
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
