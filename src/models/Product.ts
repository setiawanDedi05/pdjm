import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db/connection';

interface ProductAttributes {
  id: number;
  serial_number: string;
  name: string;
  stock: number;
  price_buy: number;
  price_sell: number;
  category: string;
  buy_date: Date | string | null;
  buy_from: string | null;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'buy_date' | 'buy_from'> {}

class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: number;
  declare serial_number: string;
  declare name: string;
  declare stock: number;
  declare price_buy: number;
  declare price_sell: number;
  declare category: string;
  declare buy_date: Date | string | null;
  declare buy_from: string | null;
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
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Umum',
    },
    buy_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    buy_from: {
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
      { fields: ['category'] },
      { fields: ['name'] },
    ],
  }
);

export default Product;

