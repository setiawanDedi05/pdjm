export type UserRole = 'admin' | 'kasir' | 'mekanik';
export type PaymentMethod = 'cash' | 'qris' | 'va' | 'hutang' | 'transfer';
export type TransactionStatus = 'pending' | 'paid' | 'cancelled' | 'draft' | 'inprogress';
export type StockLogType = 'in' | 'out';
export type StockLogReason = 'sale' | 'adjustment' | 'purchase';

export interface ServiceFee {
  id: string;
  service_fee_name: string;
  amount: number;
}

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
  description?: string | null;
  stock: number;
  minimum_stock: number;
  price_buy: number;
  price_sell: number;
  buy_date?: string | null;
  suplier?: string | null;
  alias_supplier?: string | null;
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
  toko_name?: string;
  no_telp?: string;
  vehicle_plate: string;
  user_id: number;
  user: User;
  midtrans_order_id?: string | null;
  due_date?: Date;
  createdAt: Date;
  updatedAt: Date;
  details?: TransactionDetail[];
  reference_number?: string | null;
}

export interface TransactionDetail {
  id: number;
  transaction_id: number;
  product_id: number;
  product_type: 'part' | 'service' | 'discount';
  product_name?: string;
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
  customer_name?: string;
  vehicle_plate?: string;
  toko_name?: string;
  no_telp?: string;
  due_date?: string;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  midtrans_order_id?: string | null;
  items: Array<{
    product_id: number;
    product_name?: string;
    qty: number;
    price_at_time: number;
    subtotal: number;
  }>;
  total_price: number;
  service_fees?: Array<{
    service_name: string;
    service_price: number;
  }>;
  discount?: Array<{
    discount_name: string;
    discount_price: number;
  }>;
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

