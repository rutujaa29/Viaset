import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    cookieName: process.env.JWT_COOKIE_NAME ?? 'scip_token',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  subscriptionLimits: {
    BASIC: { searchesPerMonth: 50, export: false, advancedFilters: false, maxUsers: 1 },
    PRO: { searchesPerMonth: null, export: true, advancedFilters: true, maxUsers: 3 },
    ENTERPRISE: { searchesPerMonth: null, export: true, advancedFilters: true, maxUsers: null },
  } as Record<string, { searchesPerMonth: number | null; export: boolean; advancedFilters: boolean; maxUsers: number | null }>,
};
