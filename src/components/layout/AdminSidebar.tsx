import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Tag, Users, Settings, LogOut, X, Zap,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Products', icon: ShoppingBag, path: '/admin/products' },
  { label: 'Orders', icon: Package, path: '/admin/orders' },
  { label: 'Categories', icon: Tag, path: '/admin/categories' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { logout } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 flex items-center justify-center rounded-sm">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display text-xl text-white tracking-widest">DH-ADMIN</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 font-bold text-xs tracking-[0.15em] uppercase transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-600')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all mb-1"
        >
          <ShoppingBag className="w-4 h-4" />
          VIEW STORE
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          SIGN OUT
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-navy-900 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-64 bg-navy-900 border-r border-white/5 flex flex-col sidebar-transition">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
