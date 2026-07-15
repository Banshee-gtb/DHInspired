import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from '@/components/features/CartDrawer';

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm'
          : isHome
          ? 'bg-transparent'
          : 'bg-white border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="DH-Inspired"
                className="w-9 h-9 rounded-xl object-cover"
              />
              <span className={`font-display text-2xl tracking-widest transition-colors duration-200 ${
                scrolled || !isHome ? 'text-navy-950' : 'text-white'
              } group-hover:text-blue-600`}>
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
                    location.pathname === to
                      ? 'text-blue-600'
                      : scrolled || !isHome
                      ? 'text-gray-500 hover:text-navy-900'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={openCart}
                className={`relative p-2.5 rounded-xl transition-all group ${
                  scrolled || !isHome
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    : 'hover:bg-white/10 text-white'
                }`}
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-black min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`md:hidden p-2.5 rounded-xl transition-all ${
                  scrolled || !isHome ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white'
                }`}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-xl border-t border-gray-100 px-4 py-5 space-y-1 animate-fade-in shadow-xl">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Shop All' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center py-3.5 text-sm font-bold border-b border-gray-100 transition-colors ${
                  location.pathname === to ? 'text-blue-600' : 'text-gray-700 hover:text-navy-900'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { openCart(); setMenuOpen(false); }}
              className="flex items-center gap-3 py-3.5 text-sm font-bold text-gray-700 hover:text-navy-900 transition-colors w-full"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart {totalItems > 0 && <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{totalItems}</span>}
            </button>
          </div>
        )}
      </nav>

      <CartDrawer />
    </>
  );
}
