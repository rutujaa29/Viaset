import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany, requireRole } from '../middleware/auth.js';
import type { Role } from '@prisma/client';

const router = Router();
router.use(authMiddleware, requireCompany);

router.get('/status', async (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      searchesUsedThisMonth: true,
      searchLimitMonth: true,
      resetUsageOn: true,
    },
  });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  return res.json(company);
});

router.get('/users', requireRole('COMPANY_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  if (req.user!.role === 'ADMIN' && req.query.companyId) {
    const targetId = req.query.companyId as string;
    const users = await prisma.user.findMany({
      where: { companyId: targetId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return res.json(users);
  }
  const users = await prisma.user.findMany({
    where: { companyId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return res.json(users);
});

export default router;
