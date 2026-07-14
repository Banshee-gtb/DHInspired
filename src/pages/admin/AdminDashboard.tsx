import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Tag, TrendingUp, ArrowRight, Clock, Settings, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import InstallPWAButton from '@/components/features/InstallPWAButton';

interface Stats {
  products: number;
  orders: number;
  categories: number;
  revenue: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  confirmed: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  shipped:   'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
  delivered: 'bg-green-500/10 text-green-400 border border-green-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, categories: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pRes, oRes, cRes, rRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount_paid').neq('status', 'cancelled'),
      ]);
      const revenue = rRes.data?.reduce((s: number, o: { amount_paid: number }) => s + (o.amount_paid || 0), 0) ?? 0;
      setStats({ products: pRes.count ?? 0, orders: oRes.count ?? 0, categories: cRes.count ?? 0, revenue });

      const { data: orders } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false }).limit(5);
      if (orders) setRecentOrders(orders);
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Products', value: stats.products, icon: ShoppingBag, accent: 'border-blue-500/40 bg-blue-500/5', iconClass: 'text-blue-400', link: '/admin/products' },
    { label: 'Orders', value: stats.orders, icon: Package, accent: 'border-green-500/40 bg-green-500/5', iconClass: 'text-green-400', link: '/admin/orders' },
    { label: 'Categories', value: stats.categories, icon: Tag, accent: 'border-yellow-500/40 bg-yellow-500/5', iconClass: 'text-yellow-400', link: '/admin/categories' },
    { label: 'Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, accent: 'border-purple-500/40 bg-purple-500/5', iconClass: 'text-purple-400', link: '/admin/orders' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="admin-card h-28 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">Control Center</span>
          <h1 className="font-display text-5xl text-white tracking-wider mt-1">DASHBOARD</h1>
        </div>
        <InstallPWAButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`admin-card hover:border-opacity-80 transition-all group relative overflow-hidden border ${card.accent}`}
          >
            <div className="flex items-start justify-between mb-4">
              <card.icon className={`w-5 h-5 ${card.iconClass}`} />
              <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <p className="font-black text-white text-2xl leading-none">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1.5 uppercase tracking-widest font-bold">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">Recent Orders</h2>
          </div>
          <Link to="/admin/orders" className="text-xs font-black tracking-widest text-gray-500 hover:text-blue-400 uppercase transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-10 h-10 mx-auto mb-2 text-navy-700" />
            <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-navy-900 border border-navy-700 hover:border-navy-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{order.customer_name}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-widest ${STATUS_STYLES[order.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/30'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{order.customer_phone} · {formatDate(order.created_at)}</p>
                </div>
                <p className="font-black text-blue-400 flex-shrink-0">{formatPrice(order.amount_paid)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/products', icon: ShoppingBag, label: 'ADD PRODUCT', color: 'hover:border-blue-500/60 hover:bg-blue-500/10', iconColor: 'text-blue-400' },
            { to: '/admin/orders', icon: Package, label: 'VIEW ORDERS', color: 'hover:border-green-500/60 hover:bg-green-500/10', iconColor: 'text-green-400' },
            { to: '/admin/categories', icon: Tag, label: 'CATEGORIES', color: 'hover:border-yellow-500/60 hover:bg-yellow-500/10', iconColor: 'text-yellow-400' },
            { to: '/admin/settings', icon: Settings, label: 'SETTINGS', color: 'hover:border-purple-500/60 hover:bg-purple-500/10', iconColor: 'text-purple-400' },
          ].map(({ to, icon: Icon, label, color, iconColor }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-2.5 p-4 bg-navy-900 border border-navy-700 transition-all ${color} group`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
              <span className="text-[10px] font-black tracking-[0.15em] text-gray-500 group-hover:text-white transition-colors text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
