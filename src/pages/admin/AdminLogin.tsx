import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';

export default function AdminLogin() {
  const { isAuthenticated, login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke('admin-login', {
      body: { email: email.trim(), password },
    });

    if (error) {
      let msg = 'Login failed';
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          const parsed = JSON.parse(text || '{}');
          msg = parsed?.error || msg;
        } catch {
          msg = error.message;
        }
      }
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (data?.success) {
      login(data.email);
      toast.success('Welcome back!');
      navigate('/admin/dashboard', { replace: true });
    } else {
      toast.error(data?.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dh-admin flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Accent blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />

      {/* Blue scan line */}
      <div
        className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
        style={{ animation: 'scanline 6s linear infinite' }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 mb-5">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="font-display text-5xl text-white tracking-widest">DH-INSPIRED</h1>
          <p className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-navy-700 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">Sign In</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="dh-label">Email Address</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin email"
                className="dh-input"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="dh-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="dh-input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dh-btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6 tracking-widest uppercase">
          Authorized Access Only
        </p>
      </div>
    </div>
  );
}
