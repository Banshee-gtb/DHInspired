import { Link } from 'react-router-dom';
import { ShoppingBag, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dh-hero flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-8xl font-bold text-white/20 mb-4">404</p>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-purple-300 mb-8">The page you're looking for doesn't exist.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-dh-purple font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-dh-purple text-white font-semibold px-6 py-3 rounded-xl hover:bg-dh-purple-dark transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}
