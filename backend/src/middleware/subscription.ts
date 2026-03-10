import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';

export async function checkSearchLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) return next();
  if (req.user.role === 'ADMIN') return next();

  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
  });
  if (!company) return next();

  const limits = config.subscriptionLimits[company.subscriptionPlan];
  if (limits.searchesPerMonth == null) return next(); // unlimited

  // Reset counter if we're in a new month
  const now = new Date();
  const resetOn = company.resetUsageOn;
  if (resetOn && now >= resetOn) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.company.update({
      where: { id: company.id },
      data: {
        searchesUsedThisMonth: 0,
        resetUsageOn: nextReset,
      },
    });
  }

  const used = company.searchesUsedThisMonth;
  const limit = limits.searchesPerMonth;

  if (limit !== null && used >= limit) {
    return res.status(403).json({
      error: 'Search limit reached for this month',
      limit,
      used,
    });
  }
  next();
}

export function requireExport(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) return next();
  if (req.user.role === 'ADMIN') return next();

  // We'll check company plan in the route using prisma
  next();
}

export function requireAdvancedFilters(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) return next();
  if (req.user.role === 'ADMIN') return next();
  // Actual plan check is done in the search handler based on company.subscriptionPlan
  next();
}
