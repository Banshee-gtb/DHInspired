export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  base_price: number;
  has_variants: boolean;
  tags: string[];
  category_id: string | null;
  category?: Category;
  product_variants?: ProductVariant[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_title: string;
  variant_info: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  delivery_type: string;
  delivery_location: string;
  delivery_notes: string;
  amount_paid: number;
  payment_reference: string;
  payment_method: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  productTitle: string;
  variantInfo: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  type: string;
  is_active: boolean;
}

export interface DeliveryOption {
  id: string;
  label: string;
  type: string;
  fee: number;
  is_active: boolean;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}
