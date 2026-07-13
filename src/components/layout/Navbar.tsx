import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from '@/components/features/CartDrawer';

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-dh-purple" />
              <span className="font-display font-bold text-xl text-dh-purple-dark tracking-tight">
                DH-Inspired
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-dh-purple font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-gray-700 hover:text-dh-purple font-medium transition-colors duration-200"
              >
                Shop
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-purple-50 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dh-purple text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-purple-50 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-purple-100 px-4 py-4 space-y-3 animate-fade-in">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-dh-purple font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="block py-2 text-gray-700 hover:text-dh-purple font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
            <button
              onClick={() => { openCart(); setMenuOpen(false); }}
              className="flex items-center gap-2 py-2 text-gray-700 hover:text-dh-purple font-medium"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart {totalItems > 0 && `(${totalItems})`}
            </button>
          </div>
        )}
      </nav>

      <CartDrawer />
    </>
  );
}
