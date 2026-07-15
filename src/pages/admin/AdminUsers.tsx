import { useEffect, useState } from 'react';
import { Users, Phone, Mail, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface CustomerSummary {
  phone: string;
  name: string;
  email: string;
  orderCount: number;
  lastOrder: string;
}

export default function AdminUsers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('orders').select('customer_name, customer_phone, customer_email, created_at').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, CustomerSummary>();
          (data as Pick<Order, 'customer_name' | 'customer_phone' | 'customer_email' | 'created_at'>[]).forEach((o) => {
            const key = o.customer_phone;
            if (!map.has(key)) {
              map.set(key, { phone: o.customer_phone, name: o.customer_name, email: o.customer_email, orderCount: 1, lastOrder: o.created_at });
            } else {
              const existing = map.get(key)!;
              map.set(key, { ...existing, orderCount: existing.orderCount + 1 });
            }
          });
          setCustomers(Array.from(map.values()));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">CUSTOMERS</h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Guest checkout customers from orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="admin-card h-16 skeleton-dark" />)}</div>
      ) : customers.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Users className="w-12 h-12 mx-auto text-navy-700 mb-3" />
          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No customers yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.phone} className="admin-card hover:border-navy-600/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm">{c.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(c.lastOrder)}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-400 text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0">
                {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
