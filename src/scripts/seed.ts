import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local BEFORE any DB imports so DATABASE_URL is available
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  // Dynamic imports ensure env vars are set before Sequelize connects
  const { default: sequelize } = await import('../lib/db/connection');
  const { default: User } = await import('../models/User');
  // Import associations so FK constraints are registered
  await import('../models/index');

  await sequelize.authenticate();
  
  await sequelize.sync({ alter: true });
  
  // ─── Admin user ────────────────────────────────────────────────────────────

  await User.findOrCreate({
    where: { username: 'admin satu' },
    defaults: { username: 'admin1', password: 'admin123', role: 'admin' },
  });

  await User.findOrCreate({
    where: { username: 'admin dua' },
    defaults: { username: 'admin2', password: 'admin123', role: 'admin' },
  });

  await User.findOrCreate({
    where: { username: 'admin tiga' },
    defaults: { username: 'admin3', password: 'admin123', role: 'admin' },
  });

  // ─── Kasir user ────────────────────────────────────────────────────────────
  await User.findOrCreate({
    where: { username: 'kasir satu' },
    defaults: { username: 'kasir1', password: 'kasir123', role: 'kasir' },
  });
  await User.findOrCreate({
    where: { username: 'kasir dua' },
    defaults: { username: 'kasir2', password: 'kasir123', role: 'kasir' },
  });
  await User.findOrCreate({
    where: { username: 'kasir tiga' },
    defaults: { username: 'kasir3', password: 'kasir123', role: 'kasir' },
  });
  await User.findOrCreate({
    where: { username: 'kasir empat' },
    defaults: { username: 'kasir4', password: 'kasir123', role: 'kasir' },
  });
  await sequelize.close();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

