import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative text-center animate-fade-in">
        <p className="font-display text-[12rem] text-navy-800 leading-none select-none">404</p>
        <div className="-mt-10 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-400 fill-current" />
            <span className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase">Page Not Found</span>
          </div>
          <h1 className="font-display text-5xl text-white tracking-wider">DEAD END</h1>
          <p className="text-gray-500 mt-3 text-sm">This page doesn't exist. Let's get you back on track.</p>
        </div>
        <Link to="/" className="dh-btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
