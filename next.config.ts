import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'bcryptjs', 'jsonwebtoken']
};

export default nextConfig;
