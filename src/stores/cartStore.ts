'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, PaymentMethod, Product } from '@/types';

type ServiceFeeType = {
  serviceName: string;
  servicePrice: number;
}

type DiscountType = {
  discountName: string;
  discountPrice: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  vehiclePlate: string;
  tokoName: string;
  noTelp: string;
  paymentMethod: PaymentMethod;
  serviceFee : ServiceFeeType[];
  discount: DiscountType[];
  transactionId: number | null;


  // Actions
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setVehiclePlate: (plate: string) => void;
  setTokoName: (name: string) => void;
  setNoTelp: (noTelp: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setServiceFee: (serviceFees: ServiceFeeType[]) => void;
  addServiceFee: (serviceFee: ServiceFeeType) => void;
  setDiscount: (discounts: DiscountType[]) => void;
  addDiscount: (discount: DiscountType) => void;
  setTransactionId: (transactionId: number) => void;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: '',
      vehiclePlate: '',
      tokoName: '',
      noTelp: '',
      paymentMethod: 'cash',
      serviceFee: [],
      transactionId: null,
      discount: [],

      setTransactionId: (transactionId: number) => set({ transactionId }),

      addItem: (product: Product, qty = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            const newQty = Math.min(existing.qty + qty, product.stock);
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, qty: newQty, subtotal: newQty * product.price_sell }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                product,
                qty: Math.min(qty, product.stock),
                subtotal: Math.min(qty, product.stock) * product.price_sell,
              },
            ],
          };
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQty: (productId: number, qty: number) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.product.id !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.product.id === productId
                ? {
                    ...i,
                    qty: Math.min(qty, i.product.stock),
                    subtotal: Math.min(qty, i.product.stock) * i.product.price_sell,
                  }
                : i
            ),
          };
        });
      },

      clearCart: () =>
        set({ items: [], customerName: '', vehiclePlate: '', paymentMethod: 'cash', serviceFee: [], tokoName: '', noTelp: '', transactionId: null }),

      setCustomerName: (name: string) => set({ customerName: name }),
      setVehiclePlate: (plate: string) => set({ vehiclePlate: plate }),
      setTokoName: (name: string) => set({ tokoName: name }),
      setNoTelp: (noTelp: string) => set({ noTelp }),
      setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),
      setServiceFee: (serviceFees: ServiceFeeType[]) => set({ serviceFee: serviceFees }),
      addServiceFee: (serviceFee: ServiceFeeType) => set((state) => ({ serviceFee: [...state.serviceFee, serviceFee] })),
      addDiscount: (discount: DiscountType) => set((state) => ({ discount: [...state.discount, discount] })),
      setDiscount: (discounts: DiscountType[]) => set({ discount: discounts }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
      
    }),
    {
      name: 'bengkel-pos-cart',
      partialize: (state) => ({
        items: state.items,
        customerName: state.customerName,
        vehiclePlate: state.vehiclePlate,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);

