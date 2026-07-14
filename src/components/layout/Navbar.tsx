import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from '@/components/features/CartDrawer';

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy-950/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-sm group-hover:bg-blue-500 transition-colors">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display text-2xl text-white tracking-widest group-hover:text-blue-400 transition-colors">
                DH-INSPIRED
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { to: '/', label: 'HOME' },
                { to: '/products', label: 'SHOP' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-xs font-black tracking-[0.2em] transition-colors duration-200 ${
                    location.pathname === to ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-sm hover:bg-white/10 transition-colors group"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-sm flex items-center justify-center leading-none px-0.5">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2.5 rounded-sm hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-navy-950/98 backdrop-blur-xl border-t border-white/5 px-4 py-5 space-y-1 animate-fade-in">
            {[
              { to: '/', label: 'HOME' },
              { to: '/products', label: 'SHOP ALL' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block py-3 text-xs font-black tracking-[0.2em] text-gray-400 hover:text-white border-b border-white/5 transition-colors"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { openCart(); setMenuOpen(false); }}
              className="flex items-center gap-3 py-3 text-xs font-black tracking-[0.2em] text-gray-400 hover:text-white transition-colors w-full"
            >
              <ShoppingCart className="w-4 h-4" />
              CART {totalItems > 0 && `(${totalItems})`}
            </button>
          </div>
        )}
      </nav>

      <CartDrawer />
    </>
  );
}
