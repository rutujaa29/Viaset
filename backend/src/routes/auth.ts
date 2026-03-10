import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config.js';
import type { Role } from '@prisma/client';

const router = Router();

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function signToken(userId: string, email: string, role: Role, companyId: string | null) {
  return jwt.sign(
    { userId, email, role, companyId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional().trim().isLength({ max: 200 }),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name, companyName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const company = await prisma.company.create({
      data: {
        name: companyName,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        searchLimitMonth: 50,
        resetUsageOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: 'COMPANY_ADMIN',
        companyId: company.id,
      },
    });

    const token = signToken(user.id, user.email, user.role, user.companyId);
    res.cookie(config.jwt.cookieName, token, cookieOptions);
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: { id: company.id, name: company.name, subscriptionPlan: company.subscriptionPlan },
      },
    });
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id, user.email, user.role, user.companyId);
    res.cookie(config.jwt.cookieName, token, cookieOptions);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: user.company
          ? {
            id: user.company.id,
            name: user.company.name,
            subscriptionPlan: user.company.subscriptionPlan,
            subscriptionStatus: user.company.subscriptionStatus,
            searchesUsedThisMonth: user.company.searchesUsedThisMonth,
            searchLimitMonth: user.company.searchLimitMonth,
          }
          : null,
      },
    });
  }
);

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(config.jwt.cookieName, { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { company: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safe } = user as typeof user & { passwordHash?: string };
  return res.json(safe);
});

export default router;
