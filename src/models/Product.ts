import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';

interface ProductAttributes {
  id: number;
  serial_number: string;
  name: string;
  description?: string | null;
  stock: number;
  minimum_stock?: number;
  price_buy: number;
  price_sell: number;
  buy_date: Date | string | null;
  suplier: string | null;
  alias_supplier: string | null;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: number;
  declare serial_number: string;
  declare name: string;
  declare description?: string | null;
  declare stock: number;
  declare minimum_stock?: number;
  declare price_buy: number;
  declare price_sell: number;
  declare buy_date: Date | string | null;
  declare suplier: string | null;
  declare alias_supplier: string | null;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minimum_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
      validate: {
        min: 1,
      },
    },
    price_buy: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    price_sell: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    buy_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    suplier: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    alias_supplier: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'products',
    indexes: [
      { unique: true, fields: ['serial_number'] },
      { fields: ['name'] },
    ],
  }
);

export default Product;

