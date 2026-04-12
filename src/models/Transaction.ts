import { DataTypes, Model, Op, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';
import type { PaymentMethod, TransactionStatus } from '@/types';

interface TransactionAttributes {
  id: number;
  invoice_number: string;
  total_price: number;
  service_fee: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  customer_name?: string;
  vehicle_plate?: string;
  toko_name?: string;
  no_telp?: string;
  user_id?: number;
  midtrans_order_id: string | null;
  due_date?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'midtrans_order_id' | 'service_fee'> {}

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: number;
  declare invoice_number: string;
  declare total_price: number;
  declare service_fee: number;
  declare payment_method: PaymentMethod;
  declare status: TransactionStatus;
  declare customer_name: string;
  declare vehicle_plate: string;
  declare toko_name?: string;
  declare no_telp?: string;
  declare user_id?: number;
  declare midtrans_order_id: string | null;
  declare due_date?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    service_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'qris', 'va', 'hutang', 'transfer'),
      allowNull: false,
      defaultValue: 'cash',
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    toko_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    no_telp: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        customValidate(value: string){
          if(this.payment_method === 'hutang' && (!value || value.trim() === '')){
            throw new Error('Nomor telepon wajib diisi untuk metode pembayaran Hutang');
          }
        }
      }
    },
    customer_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    vehicle_plate: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    midtrans_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    indexes: [
      { unique: true, fields: ['invoice_number'] },
      { fields: ['status'] },
      { fields: ['customer_name'] },
      { fields: ['vehicle_plate'] },
      { fields: ['toko_name'] },
      { fields: ['no_telp'] },
    ],
    hooks:{
      beforeValidate: async (transaction) => {

        // 1. Cek apakah name kosong
        if (!transaction.customer_name || transaction.customer_name.trim() === '') {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          // 2. Hitung jumlah customer yang dibuat hari ini
          const countToday = await Transaction.count({
            where: {
              createdAt: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });

          // 3. Set nama otomatis: Customer + (jumlah + 1)
          transaction.customer_name = `Customer ${countToday + 1}`;
        }

        if (!transaction.due_date) {
          const now = new Date();
          if (transaction.payment_method === 'hutang') {
            // Tambah 30 hari untuk Hutang
            now.setDate(now.getDate() + 30);
          } else {
            // Default untuk metode lain (misal: 7 hari)
            now.setDate(now.getDate() + 7);
          }
          transaction.due_date = now.toISOString();
        }
      }
    }
  }
);

export default Transaction;

