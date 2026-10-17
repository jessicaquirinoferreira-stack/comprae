export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  suggested_cost_base: number;
  virality_score: number;
  cost_price: number;
  profit_margin: number;
  price: number;
  image_url: string;
  images?: string[];
  stock: number;
  badge?: string;
  created_at: string;
  updated_at?: string;
  source?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ShippingOption {
  code: string;
  name: string;
  price: number;
  days: number;
  carrier: 'Correios';
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_cpf: string;
  shipping_address: ShippingAddress;
  shipping_service: string;
  shipping_cost: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'infinitepay_pix' | 'infinitepay_card';
  payment_link?: string;
  infinitepay_handle: string;
  created_at: string;
}

export interface StoreSettings {
  instagram: string;
  tiktok: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  store_name: string;
  infinitepay_handle: string;
  infinitepay_payment_link?: string;
  pix_key?: string;
  banner_announcement: string;
  updated_at?: string;
}

export interface ViralCandidate {
  id: string;
  name: string;
  description: string;
  category: string;
  source_platform: 'Shopee' | 'Mercado Livre' | 'TikTok Shop' | 'AliExpress';
  suggested_cost_base: number;
  virality_score: number;
  sales_velocity: string;
  image_url: string;
}
