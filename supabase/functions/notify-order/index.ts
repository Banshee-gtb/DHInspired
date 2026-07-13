import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch WhatsApp number from settings
    const { data: waSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_number')
      .single();

    const waNumber = waSetting?.value || '';

    // Build the WhatsApp message
    const items = order.order_items || [];
    const itemsText = items.map((item: { product_title: string; variant_info?: string; quantity: number; price: number }) =>
      `• ${item.product_title}${item.variant_info ? ` (${item.variant_info})` : ''} x${item.quantity} - ₦${item.price.toLocaleString()}`
    ).join('\n');

    const message = `🛍️ *NEW ORDER - DH-Inspired*\n\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Phone:* ${order.customer_phone}\n` +
      `*Email:* ${order.customer_email || 'N/A'}\n` +
      `*Address:* ${order.customer_address || 'N/A'}\n` +
      `*Delivery:* ${order.delivery_type === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n` +
      (order.delivery_location ? `*Location:* ${order.delivery_location}\n` : '') +
      (order.delivery_notes ? `*Notes:* ${order.delivery_notes}\n` : '') +
      `\n*Items:*\n${itemsText}\n\n` +
      `*Total:* ₦${order.amount_paid.toLocaleString()}\n` +
      `*Payment Method:* ${order.payment_method}\n` +
      `*Reference:* ${order.payment_reference || 'Pending'}\n` +
      `*Order ID:* ${order.id.slice(0, 8).toUpperCase()}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = waNumber ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodedMessage}` : null;

    console.log('Order notification prepared for order:', orderId);
    console.log('WhatsApp URL:', whatsappUrl);

    return new Response(
      JSON.stringify({ success: true, whatsappUrl, message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Notify order error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
