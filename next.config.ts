import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'bcryptjs', 'jsonwebtoken'],
  devIndicators:false
};

export default nextConfig;
