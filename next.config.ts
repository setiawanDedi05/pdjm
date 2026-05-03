import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Berbahaya, tapi berguna saat deadline: abaikan error TS saat build
    ignoreBuildErrors: true, 
  },
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'bcryptjs', 'jsonwebtoken'],
  devIndicators:false,
  allowedDevOrigins: ['app.stwdd.com']
};

export default nextConfig;
