import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { BankAccount, DeliveryOption } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Truck, CreditCard, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    deliveryOptionId: '',
    deliveryType: 'delivery',
    pickupLocation: '',
    notes: '',
    selectedBankId: '',
    paymentRef: '',
  });

  useEffect(() => {
    if (items.length === 0) navigate('/products');
  }, [items]);

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['bank_accounts', 'delivery_options'])
      .then(({ data }) => {
        if (!data) return;
        data.forEach((s: { key: string; value: string }) => {
          if (s.key === 'bank_accounts') {
            const parsed = JSON.parse(s.value || '[]') as BankAccount[];
            setBankAccounts(parsed.filter((b) => b.is_active));
          }
          if (s.key === 'delivery_options') {
            const parsed = JSON.parse(s.value || '[]') as DeliveryOption[];
            const active = parsed.filter((d) => d.is_active);
            setDeliveryOptions(active);
            if (active.length > 0) {
              setForm((f) => ({ ...f, deliveryOptionId: active[0].id, deliveryType: active[0].type }));
            }
          }
        });
      });
  }, []);

  const selectedDelivery = deliveryOptions.find((d) => d.id === form.deliveryOptionId);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const grandTotal = totalPrice + deliveryFee;
  const selectedBank = bankAccounts.find((b) => b.id === form.selectedBankId);

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const buildWhatsAppMessage = (order: { id: string; customer_name: string; customer_phone: string; customer_address?: string; delivery_type: string; delivery_location?: string; delivery_notes?: string; amount_paid: number; payment_method: string; payment_reference?: string }) => {
    const itemsText = items.map((item) =>
      `• ${item.productTitle}${item.variantInfo ? ` (${item.variantInfo})` : ''} x${item.quantity} — ₦${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    return encodeURIComponent(
      `🛒 *NEW ORDER - DH-INSPIRED*\n\n` +
      `*Order ID:* #${order.id.slice(0, 8).toUpperCase()}\n\n` +
      `*👤 Customer*\n` +
      `Name: ${order.customer_name}\n` +
      `Phone: ${order.customer_phone}\n` +
      (form.email ? `Email: ${form.email}\n` : '') +
      `\n*🚚 Delivery*\n` +
      `Method: ${order.delivery_type === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n` +
      (order.customer_address ? `Address: ${order.customer_address}\n` : '') +
      (order.delivery_location ? `Location: ${order.delivery_location}\n` : '') +
      (order.delivery_notes ? `Notes: ${order.delivery_notes}\n` : '') +
      `\n*🧾 Items*\n${itemsText}\n\n` +
      `*💰 Payment*\n` +
      `Total: ₦${order.amount_paid.toLocaleString()}\n` +
      `Method: ${order.payment_method}\n` +
      (order.payment_reference ? `Reference: ${order.payment_reference}\n` : '') +
      `\n_Sent from DH-Inspired checkout_`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Name and phone number are required');
      return;
    }
    if (selectedDelivery?.type === 'delivery' && !form.address) {
      toast.error('Delivery address is required');
      return;
    }

    setLoading(true);

    const fullAddress = selectedDelivery?.type === 'delivery'
      ? [form.address, form.city, form.state, form.zipCode, form.country].filter(Boolean).join(', ')
      : '';

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: fullAddress,
        delivery_type: selectedDelivery?.type ?? form.deliveryType,
        delivery_location: selectedDelivery?.type === 'pickup' ? form.pickupLocation : (selectedDelivery?.label ?? ''),
        delivery_notes: form.notes,
        amount_paid: grandTotal,
        payment_method: selectedBank
          ? `${selectedBank.type === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'} — ${selectedBank.bank_name}`
          : 'Bank Transfer',
        payment_reference: form.paymentRef,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !order) {
      toast.error('Failed to place order. Try again.');
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_title: item.productTitle,
      variant_info: item.variantInfo,
      quantity: item.quantity,
      price: item.price,
    }));

    await supabase.from('order_items').insert(orderItems);
    supabase.functions.invoke('notify-order', { body: { orderId: order.id } });

    clearCart();
    setLoading(false);

    const { data: waSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_number')
      .single();

    const waNum = waSetting?.value?.replace(/\D/g, '');
    if (waNum) {
      const msg = buildWhatsAppMessage({ ...order, customer_address: fullAddress });
      setTimeout(() => {
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
      }, 300);
    }

    navigate(`/order-confirmation/${order.id}`);
  };

  const fieldCls = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900 text-sm shadow-sm";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="font-display text-6xl text-navy-950 tracking-wider mb-8">CHECKOUT</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Left */}
              <div className="space-y-4">
                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> Contact Info
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input required className={fieldCls} placeholder="Your full name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number *</label>
                      <input required type="tel" className={fieldCls} placeholder="e.g. 08012345678" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Email (Optional)</label>
                      <input type="email" className={fieldCls} placeholder="your@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" /> Delivery Method
                  </h2>

                  {deliveryOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      {deliveryOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, deliveryOptionId: opt.id, deliveryType: opt.type }))}
                          className={`flex items-start gap-3 p-4 border-2 rounded-2xl text-left transition-all ${
                            form.deliveryOptionId === opt.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 bg-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${form.deliveryOptionId === opt.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                            {form.deliveryOptionId === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {opt.fee > 0 ? `+${formatPrice(opt.fee)}` : 'Free'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[{ key: 'delivery', label: '🚚 HOME DELIVERY' }, { key: 'pickup', label: '🏪 STORE PICKUP' }].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => update('deliveryType', key)}
                          className={`p-4 border-2 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
                            form.deliveryType === key
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {(selectedDelivery?.type === 'delivery' || (!selectedDelivery && form.deliveryType === 'delivery')) && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Street Address *</label>
                        <input required className={fieldCls} placeholder="House number, street name" value={form.address} onChange={(e) => update('address', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>City</label>
                          <input className={fieldCls} placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>State</label>
                          <input className={fieldCls} placeholder="State / Province" value={form.state} onChange={(e) => update('state', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>ZIP / Postal Code</label>
                          <input className={fieldCls} placeholder="ZIP code" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Country</label>
                          <input className={fieldCls} placeholder="Country" value={form.country} onChange={(e) => update('country', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedDelivery?.type === 'pickup' || (!selectedDelivery && form.deliveryType === 'pickup')) && (
                    <div>
                      <label className={labelCls}><MapPin className="inline w-3 h-3 mr-1" />Pickup Location</label>
                      <input className={fieldCls} placeholder="Preferred pickup location" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className={labelCls}>Order Notes (Optional)</label>
                    <textarea className={`${fieldCls} resize-none`} rows={2} placeholder="Any special instructions..." value={form.notes} onChange={(e) => update('notes', e.target.value)} />
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Payment Method
                  </h2>

                  {bankAccounts.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                      Payment details not yet configured. Contact us on WhatsApp for payment info.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Select where to transfer:</p>
                      <div className="space-y-3">
                        {bankAccounts.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => update('selectedBankId', bank.id)}
                            className={`w-full text-left p-4 border-2 rounded-2xl transition-all ${
                              form.selectedBankId === bank.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-black text-gray-900 text-sm uppercase tracking-wide">{bank.bank_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{bank.account_name}</p>
                                <p className="font-mono font-black text-blue-600 text-lg mt-1 tracking-widest">{bank.account_number}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                                  {bank.type === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'}
                                </p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.selectedBankId === bank.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                {form.selectedBankId === bank.id && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {form.selectedBankId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
                          <p className="font-black uppercase tracking-wider text-blue-600 mb-2">Payment Instructions:</p>
                          <p>1. Transfer <strong className="text-blue-900">{formatPrice(grandTotal)}</strong> to selected account</p>
                          <p>2. Enter your transfer receipt/reference number below</p>
                          <p>3. Place order — you'll be redirected to WhatsApp to confirm</p>
                        </div>
                      )}

                      <div>
                        <label className={labelCls}>Payment Reference / Receipt No.</label>
                        <input
                          className={fieldCls}
                          placeholder="Enter reference after transfer (optional)"
                          value={form.paymentRef}
                          onChange={(e) => update('paymentRef', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl text-gray-700 font-black text-xs px-4 py-3.5 uppercase tracking-widest shadow-sm"
                >
                  <span>Order Summary ({items.length} items)</span>
                  {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ${!summaryOpen ? 'hidden lg:block' : ''}`}>
                  <h3 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5">Order Summary</h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productTitle} className="w-14 h-14 object-cover flex-shrink-0 rounded-xl" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 flex-shrink-0 rounded-xl" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productTitle}</p>
                          {item.variantInfo && <p className="text-xs text-blue-600">{item.variantInfo}</p>}
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-400">x{item.quantity}</span>
                            <span className="text-sm font-black text-blue-600">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-bold text-gray-700">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery</span>
                      <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                        {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 text-lg border-t border-gray-100 pt-3 mt-2">
                      <span>TOTAL</span>
                      <span className="text-blue-600">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="dh-btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PLACING ORDER...
                    </span>
                  ) : (
                    `PLACE ORDER — ${formatPrice(grandTotal)}`
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center uppercase tracking-widest">
                  You'll be redirected to WhatsApp to confirm
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
