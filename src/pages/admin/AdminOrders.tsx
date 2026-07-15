import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Package, Phone, Mail, MapPin, Truck, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  confirmed: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  shipped: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  delivered: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  cancelled: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (filterStatus) query = query.eq('status', filterStatus);
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    const { data } = await query;
    if (data) setOrders(data);
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success(`Status → ${status}`);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">ORDERS</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{orders.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="dh-input-dark pl-11" placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="dh-input-dark sm:w-44 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="admin-card h-20 skeleton-dark" />)
        ) : orders.length === 0 ? (
          <div className="admin-card text-center py-16">
            <Package className="w-12 h-12 mx-auto text-navy-700 mb-3" />
            <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No orders found</p>
          </div>
        ) : (
          orders.map((order) => {
            const sc = STATUS_CONFIG[order.status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
            return (
              <div key={order.id} className="admin-card hover:border-navy-600/80 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-black text-white text-sm">{order.customer_name}</p>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                      {order.customer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{order.customer_email}</span>}
                      <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-0.5 text-[11px] text-gray-600">
                      <span className="flex items-center gap-1">
                        {order.delivery_type === 'pickup' ? <><MapPin className="w-3 h-3" /> Pickup</> : <><Truck className="w-3 h-3" /> Delivery</>}
                      </span>
                      {order.payment_method && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{order.payment_method}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-blue-400 text-lg">{formatPrice(order.amount_paid)}</span>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-xs border border-navy-600 rounded-xl px-3 py-2 bg-navy-700 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer capitalize"
                    >
                      {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                      {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedId === order.id && (
                  <div className="mt-4 pt-4 border-t border-navy-700/50 space-y-4 animate-fade-in">
                    {order.customer_address && (
                      <div>
                        <p className="text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Delivery Address</p>
                        <p className="text-sm text-gray-300">{order.customer_address}</p>
                      </div>
                    )}
                    {order.delivery_notes && (
                      <div>
                        <p className="text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Notes</p>
                        <p className="text-sm text-gray-300">{order.delivery_notes}</p>
                      </div>
                    )}
                    {order.payment_reference && (
                      <div>
                        <p className="text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Payment Reference</p>
                        <p className="text-sm font-mono text-blue-400 bg-navy-900 px-3 py-2 rounded-xl">{order.payment_reference}</p>
                      </div>
                    )}

                    {order.order_items && order.order_items.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">Order Items</p>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-navy-900/60 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-bold text-gray-200">{item.product_title}</p>
                                {item.variant_info && <p className="text-xs text-blue-400">{item.variant_info}</p>}
                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-black text-blue-400">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
