import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';
import type { StockLogType, StockLogReason } from '@/types';

interface StockLogAttributes {
  id: number;
  product_id: number;
  type: StockLogType;
  amount: number;
  reason: StockLogReason;
}

interface StockLogCreationAttributes extends Optional<StockLogAttributes, 'id'> {}

class StockLog
  extends Model<StockLogAttributes, StockLogCreationAttributes>
  implements StockLogAttributes
{
  declare id: number;
  declare product_id: number;
  declare type: StockLogType;
  declare amount: number;
  declare reason: StockLogReason;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StockLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    reason: {
      type: DataTypes.ENUM('sale', 'adjustment', 'purchase'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'stock_logs',
    indexes: [{ fields: ['product_id'] }, { fields: ['type'] }, { fields: ['reason'] }],
  }
);

export default StockLog;

