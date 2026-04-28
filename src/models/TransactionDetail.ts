import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';

interface TransactionDetailAttributes {
  id: number;
  transaction_id: number;
  product_id?: number;
  product_type: 'part' | 'service' | 'discount';
  product_name?: string;
  qty: number;
  price_at_time: number;
  subtotal: number;
}

interface TransactionDetailCreationAttributes
  extends Optional<TransactionDetailAttributes, 'id'> {}

class TransactionDetail
  extends Model<TransactionDetailAttributes, TransactionDetailCreationAttributes>
  implements TransactionDetailAttributes
{
  declare id: number;
  declare transaction_id: number;
  declare product_id?: number;
  declare product_type: 'part' | 'service' | 'discount';
  declare product_name?: string;
  declare qty: number;
  declare price_at_time: number;
  declare subtotal: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TransactionDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // PENTING: Jika produk dihapus, transaksi tidak hilang
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    product_type: {
      type: DataTypes.ENUM('part', 'service'),
      defaultValue: 'part',
      allowNull: true,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    price_at_time: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'transaction_details',
    indexes: [{ fields: ['transaction_id'] }, { fields: ['product_id'] }],
  }
);

export default TransactionDetail;

