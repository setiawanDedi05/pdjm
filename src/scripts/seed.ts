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
    where: { username: 'admin1' },
    defaults: { username: 'admin1', password: 'admin123', role: 'admin', name: "aji" },
  });

  await User.findOrCreate({
    where: { username: 'admin2' },
    defaults: { username: 'admin2', password: 'admin123', role: 'admin', name: "rudi" },
  });

  await User.findOrCreate({
    where: { username: 'admin3' },
    defaults: { username: 'admin3', password: 'admin123', role: 'admin', name: 'admin tiga' },
  });

  // ─── Kasir user ────────────────────────────────────────────────────────────
  await User.findOrCreate({
    where: { username: 'kasir1' },
    defaults: { username: 'kasir1', password: 'kasir123', role: 'kasir', name: 'asep' },
  });
  await User.findOrCreate({
    where: { username: 'kasir2' },
    defaults: { username: 'kasir2', password: 'kasir123', role: 'kasir', name: 'ari' },
  });
  await sequelize.close();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

