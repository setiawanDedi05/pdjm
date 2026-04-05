import sequelize from '@/lib/db/connection';
import User from './User';
import Product from './Product';
import Transaction from './Transaction';
import TransactionDetail from './TransactionDetail';
import StockLog from './StockLog';

// ─── Associations ────────────────────────────────────────────────────────────
Transaction.hasMany(TransactionDetail, {
  foreignKey: 'transaction_id',
  as: 'details',
  onDelete: 'CASCADE',
});
TransactionDetail.belongsTo(Transaction, {
  foreignKey: 'transaction_id',
  as: 'transaction',
});

Product.hasMany(TransactionDetail, {
  foreignKey: 'product_id',
  as: 'transaction_details',
});
TransactionDetail.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

Product.hasMany(StockLog, {
  foreignKey: 'product_id',
  as: 'stock_logs',
});
StockLog.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions',
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

let synced = false;

export async function syncDB(force = false) {
  if (synced && !force) return;          // skip after first successful sync
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ force, alter: !force });
    } else {
      await sequelize.authenticate();   // production: rely on migrations, only authenticate
    }
    synced = true;
  } catch (error) {
    throw error;
  }
}

export { sequelize, User, Product, Transaction, TransactionDetail, StockLog };

