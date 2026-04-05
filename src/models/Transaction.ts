import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';
import type { PaymentMethod, TransactionStatus } from '@/types';

interface TransactionAttributes {
  id: number;
  invoice_number: string;
  total_price: number;
  service_fee: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  customer_name: string;
  vehicle_plate: string;
  user_id: number;
  midtrans_order_id: string | null;
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
  declare user_id: number;
  declare midtrans_order_id: string | null;
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
      type: DataTypes.ENUM('cash', 'qris'),
      allowNull: false,
      defaultValue: 'cash',
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    customer_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    vehicle_plate: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'transactions',
    indexes: [
      { unique: true, fields: ['invoice_number'] },
      { fields: ['status'] },
      { fields: ['customer_name'] },
      { fields: ['vehicle_plate'] },
    ],
  }
);

export default Transaction;

