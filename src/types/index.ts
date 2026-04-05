export type UserRole = 'admin' | 'kasir' | 'mekanik';
export type PaymentMethod = 'cash' | 'qris' | 'va';
export type TransactionStatus = 'pending' | 'paid' | 'cancelled';
export type StockLogType = 'in' | 'out';
export type StockLogReason = 'sale' | 'adjustment' | 'purchase';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  serial_number: string;
  name: string;
  stock: number;
  price_buy: number;
  price_sell: number;
  category: string;
  buy_date?: string | null;
  buy_from?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  total_price: number;
  service_fee: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  customer_name: string;
  vehicle_plate: string;
  user_id: number;
  midtrans_order_id?: string | null;
  createdAt: Date;
  updatedAt: Date;
  details?: TransactionDetail[];
}

export interface TransactionDetail {
  id: number;
  transaction_id: number;
  product_id: number;
  qty: number;
  price_at_time: number;
  subtotal: number;
  product?: Product;
}

export interface StockLog {
  id: number;
  product_id: number;
  type: StockLogType;
  amount: number;
  reason: StockLogReason;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
}

export interface CheckoutPayload {
  customer_name: string;
  vehicle_plate: string;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  midtrans_order_id?: string | null;
  items: Array<{
    product_id: number;
    qty: number;
    price_at_time: number;
    subtotal: number;
  }>;
  total_price: number;
  service_fee?: number;
}

export interface AuthPayload {
  id: number;
  username: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

