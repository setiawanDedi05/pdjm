import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
  },
});

export default sequelize;

