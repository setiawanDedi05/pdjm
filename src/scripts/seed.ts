import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local BEFORE any DB imports so DATABASE_URL is available
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  // Dynamic imports ensure env vars are set before Sequelize connects
  const { default: sequelize } = await import('../lib/db/connection');
  const { default: User } = await import('../models/User');
  const { default: Product } = await import('../models/Product');
  const { default: StockLog } = await import('../models/StockLog');
  // Import associations so FK constraints are registered
  await import('../models/index');

  console.log('🔌 Connecting to database...');
  await sequelize.authenticate();
  console.log('✅ Connected.');

  console.log('🔄 Syncing schema (alter: true)...');
  await sequelize.sync({ alter: true });
  console.log('✅ Schema synced.');

  // ─── Admin user ────────────────────────────────────────────────────────────
  const [, adminCreated] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: { username: 'admin', password: 'admin123', role: 'admin' },
  });
  console.log(adminCreated ? '✅ Admin user created.' : '⏭  Admin user already exists.');

  // ─── Kasir user ────────────────────────────────────────────────────────────
  const [, kasirCreated] = await User.findOrCreate({
    where: { username: 'kasir' },
    defaults: { username: 'kasir', password: 'kasir123', role: 'kasir' },
  });
  console.log(kasirCreated ? '✅ Kasir user created.' : '⏭  Kasir user already exists.');

  // ─── Sample products ───────────────────────────────────────────────────────
  const products = [
    { serial_number: 'OIL-5W30-1L', name: 'Oli Mesin 5W-30 1 Liter', category: 'Oli', stock: 50, price_buy: 45000, price_sell: 65000 },
    { serial_number: 'OIL-10W40-1L', name: 'Oli Mesin 10W-40 1 Liter', category: 'Oli', stock: 40, price_buy: 40000, price_sell: 58000 },
    { serial_number: 'FILTER-OIL-AVZ', name: 'Filter Oli Toyota Avanza', category: 'Filter', stock: 30, price_buy: 25000, price_sell: 40000 },
    { serial_number: 'FILTER-AIR-AVZ', name: 'Filter Udara Toyota Avanza', category: 'Filter', stock: 25, price_buy: 35000, price_sell: 55000 },
    { serial_number: 'FILTER-FUEL-AVZ', name: 'Filter Bensin Toyota Avanza', category: 'Filter', stock: 20, price_buy: 30000, price_sell: 48000 },
    { serial_number: 'SPARK-NGK-G59', name: 'Busi NGK G-Power G59', category: 'Busi', stock: 60, price_buy: 22000, price_sell: 35000 },
    { serial_number: 'BRAKE-PAD-F-AVZ', name: 'Kampas Rem Depan Avanza', category: 'Rem', stock: 15, price_buy: 85000, price_sell: 130000 },
    { serial_number: 'BRAKE-PAD-R-AVZ', name: 'Kampas Rem Belakang Avanza', category: 'Rem', stock: 15, price_buy: 70000, price_sell: 110000 },
    { serial_number: 'COOLANT-1L-RED', name: 'Coolant Radiator Merah 1 Liter', category: 'Cairan', stock: 35, price_buy: 28000, price_sell: 45000 },
    { serial_number: 'BATTERY-NS40Z', name: 'Aki Kering NS40Z 35Ah', category: 'Aki', stock: 10, price_buy: 380000, price_sell: 520000 },
  ];

  for (const data of products) {
    const [product, created] = await Product.findOrCreate({
      where: { serial_number: data.serial_number },
      defaults: data,
    });

    if (created) {
      await StockLog.create({
        product_id: product.id,
        type: 'in',
        amount: data.stock,
        reason: 'purchase',
      });
      console.log(`✅ Product created: ${data.name}`);
    } else {
      console.log(`⏭  Product already exists: ${data.name}`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`   Admin login → username: admin  |  password: admin123`);
  console.log(`   Kasir login → username: kasir  |  password: kasir123`);
  await sequelize.close();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

