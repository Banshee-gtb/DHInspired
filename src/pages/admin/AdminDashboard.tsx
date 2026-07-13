import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Users, Tag, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, categories: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, ordersRes, categoriesRes, revenueRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount_paid').neq('status', 'cancelled'),
      ]);

      const revenue = revenueRes.data?.reduce((s: number, o: { amount_paid: number }) => s + (o.amount_paid || 0), 0) ?? 0;

      setStats({
        products: productsRes.count ?? 0,
        orders: ordersRes.count ?? 0,
        categories: categoriesRes.count ?? 0,
        revenue,
      });

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (orders) setRecentOrders(orders);

      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: ShoppingBag, color: 'bg-purple-100 text-dh-purple', link: '/admin/products' },
    { label: 'Total Orders', value: stats.orders, icon: Package, color: 'bg-blue-100 text-blue-600', link: '/admin/orders' },
    { label: 'Categories', value: stats.categories, icon: Tag, color: 'bg-green-100 text-green-600', link: '/admin/categories' },
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'bg-amber-100 text-amber-600', link: '/admin/orders' },
  ];

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-card"><div className="h-20 skeleton rounded-xl" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back to DH-Inspired Admin</p>
        </div>
        <InstallPWAButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="admin-card hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-dh-purple transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-dh-purple" /> Recent Orders
          </h2>
          <Link to="/admin/orders" className="text-sm text-dh-purple hover:text-dh-purple-dark font-medium flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-200" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone} · {formatDate(order.created_at)}</p>
                </div>
                <p className="font-bold text-dh-purple flex-shrink-0">{formatPrice(order.amount_paid)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/products" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-dh-purple hover:text-white transition-all group text-center">
            <ShoppingBag className="w-6 h-6 text-dh-purple group-hover:text-white" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-white">Add Product</span>
          </Link>
          <Link to="/admin/orders" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition-all group text-center">
            <Package className="w-6 h-6 text-blue-500 group-hover:text-white" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-white">View Orders</span>
          </Link>
          <Link to="/admin/categories" className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-500 hover:text-white transition-all group text-center">
            <Tag className="w-6 h-6 text-green-500 group-hover:text-white" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-white">Categories</span>
          </Link>
          <Link to="/admin/settings" className="flex flex-col items-center gap-2 p-4 bg-amber-50 rounded-xl hover:bg-amber-500 hover:text-white transition-all group text-center">
            <CheckCircle2 className="w-6 h-6 text-amber-500 group-hover:text-white" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-white">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
