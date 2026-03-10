import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { CompanyCategory, LeadCategory, SubscriptionPlan } from '@prisma/client';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

// Admin Dashboard Overview - Platform Metrics
router.get('/dashboard/overview', async (req: Request, res: Response) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total companies
  const totalCompanies = await prisma.company.count();

  // Active companies (logged in last 30 days)
  const activeCompanies = await prisma.user.groupBy({
    by: ['companyId'],
    where: {
      companyId: { not: null },
      updatedAt: { gte: thirtyDaysAgo },
    },
  });

  // Plan distribution
  const planDistribution = await prisma.company.groupBy({
    by: ['subscriptionPlan'],
    _count: true,
  });

  // Total searches (using SearchUsage model)
  const totalSearches = await prisma.searchUsage.aggregate({
    _sum: { count: true },
  });

  // Total users
  const totalUsers = await prisma.user.count({
    where: { role: { not: 'ADMIN' } },
  });

  // Recent companies (last 5)
  const recentCompanies = await prisma.company.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true } },
    },
  });

  return res.json({
    totalCompanies,
    activeCompanies: activeCompanies.length,
    planDistribution: planDistribution.reduce((acc, p) => {
      acc[p.subscriptionPlan] = p._count;
      return acc;
    }, {} as Record<string, number>),
    totalSearches: totalSearches._sum.count || 0,
    totalUsers,
    recentCompanies,
  });
});

// Companies (tenants) - Enhanced with usage data
router.get('/companies', async (req: Request, res: Response) => {
  const list = await prisma.company.findMany({
    include: {
      _count: { select: { users: true } },
      users: {
        select: { id: true, email: true, name: true, role: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Add last active date from most recent user activity
  const enriched = list.map(company => ({
    ...company,
    lastActive: company.users[0]?.updatedAt || company.createdAt,
    userCount: company._count.users,
  }));

  return res.json(enriched);
});

router.patch(
  '/companies/:id',
  [param('id').isString(), body('subscriptionPlan').optional().isIn(['BASIC', 'PRO', 'ENTERPRISE']), body('subscriptionStatus').optional().isIn(['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED'])],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const data: { subscriptionPlan?: SubscriptionPlan; subscriptionStatus?: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED'; searchLimitMonth?: number } = {};
    if (req.body.subscriptionPlan) data.subscriptionPlan = req.body.subscriptionPlan as SubscriptionPlan;
    if (req.body.subscriptionStatus) data.subscriptionStatus = req.body.subscriptionStatus;
    if (req.body.searchLimitMonth != null) data.searchLimitMonth = req.body.searchLimitMonth;
    const company = await prisma.company.update({ where: { id }, data });
    return res.json(company);
  }
);

// Company profiles (master DB)
router.get('/company-profiles', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? 20), 10)));
  const skip = (page - 1) * limit;
  const [list, total] = await Promise.all([
    prisma.companyProfile.findMany({
      include: {
        industries: { include: { industrySegment: true } },
        asSupplier: { include: { leadType: true } },
        asBuyer: { include: { leadType: true } },
      },
      orderBy: { companyName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.companyProfile.count(),
  ]);
  return res.json({ data: list, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

router.post(
  '/company-profiles',
  [
    body('companyName').trim().notEmpty(),
    body('category').isIn(['SUPPLIER', 'BUYER', 'BOTH']),
    body('subCategory').optional().trim(),
    body('servicesOffered').optional().isArray(),
    body('industriesServed').optional().isArray(),
    body('email').optional().trim(),
    body('phone').optional().trim(),
    body('website').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('country').optional().trim(),
    body('certifications').optional().trim(),
    body('notes').optional().trim(),
    body('companySize').optional().trim(),
    body('industrySegmentIds').optional().isArray(),
    body('supplierLeadTypeIds').optional().isArray(),
    body('buyerLeadTypeIds').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      companyName,
      category,
      subCategory,
      servicesOffered = [],
      industriesServed = [],
      email,
      phone,
      website,
      city,
      state,
      country,
      certifications,
      notes,
      companySize,
      industrySegmentIds = [],
      supplierLeadTypeIds = [],
      buyerLeadTypeIds = [],
    } = req.body;

    const profile = await prisma.companyProfile.create({
      data: {
        companyName,
        category: category as CompanyCategory,
        subCategory: subCategory || null,
        servicesOffered: Array.isArray(servicesOffered) ? servicesOffered : [],
        industriesServed: Array.isArray(industriesServed) ? industriesServed : [],
        email: email || null,
        phone: phone || null,
        website: website || null,
        city: city || null,
        state: state || null,
        country: country || null,
        certifications: certifications || null,
        notes: notes || null,
        companySize: companySize || null,
      },
    });

    if (industrySegmentIds?.length) {
      await prisma.companyProfileIndustry.createMany({
        data: industrySegmentIds.map((sid: string) => ({
          companyProfileId: profile.id,
          industrySegmentId: sid,
        })),
      });
    }
    if (supplierLeadTypeIds?.length) {
      await prisma.companyLeadSupplier.createMany({
        data: supplierLeadTypeIds.map((lid: string) => ({
          companyProfileId: profile.id,
          leadTypeId: lid,
        })),
      });
    }
    if (buyerLeadTypeIds?.length) {
      await prisma.companyLeadBuyer.createMany({
        data: buyerLeadTypeIds.map((lid: string) => ({
          companyProfileId: profile.id,
          leadTypeId: lid,
        })),
      });
    }

    const full = await prisma.companyProfile.findUnique({
      where: { id: profile.id },
      include: {
        industries: { include: { industrySegment: true } },
        asSupplier: { include: { leadType: true } },
        asBuyer: { include: { leadType: true } },
      },
    });
    return res.status(201).json(full);
  }
);

router.patch(
  '/company-profiles/:id',
  [
    param('id').isString(),
    body('companyName').optional().trim().notEmpty(),
    body('category').optional().isIn(['SUPPLIER', 'BUYER', 'BOTH']),
    body('subCategory').optional().trim(),
    body('servicesOffered').optional().isArray(),
    body('industriesServed').optional().isArray(),
    body('email').optional().trim(),
    body('phone').optional().trim(),
    body('website').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('country').optional().trim(),
    body('certifications').optional().trim(),
    body('notes').optional().trim(),
    body('companySize').optional().trim(),
    body('industrySegmentIds').optional().isArray(),
    body('supplierLeadTypeIds').optional().isArray(),
    body('buyerLeadTypeIds').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const allowed = [
      'companyName', 'category', 'subCategory', 'servicesOffered', 'industriesServed',
      'email', 'phone', 'website', 'city', 'state', 'country', 'certifications', 'notes', 'companySize',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    await prisma.companyProfile.update({ where: { id }, data: data as Parameters<typeof prisma.companyProfile.update>[0]['data'] });

    if (req.body.industrySegmentIds !== undefined) {
      await prisma.companyProfileIndustry.deleteMany({ where: { companyProfileId: id } });
      if (req.body.industrySegmentIds.length) {
        await prisma.companyProfileIndustry.createMany({
          data: req.body.industrySegmentIds.map((sid: string) => ({ companyProfileId: id, industrySegmentId: sid })),
        });
      }
    }
    if (req.body.supplierLeadTypeIds !== undefined) {
      await prisma.companyLeadSupplier.deleteMany({ where: { companyProfileId: id } });
      if (req.body.supplierLeadTypeIds.length) {
        await prisma.companyLeadSupplier.createMany({
          data: req.body.supplierLeadTypeIds.map((lid: string) => ({ companyProfileId: id, leadTypeId: lid })),
        });
      }
    }
    if (req.body.buyerLeadTypeIds !== undefined) {
      await prisma.companyLeadBuyer.deleteMany({ where: { companyProfileId: id } });
      if (req.body.buyerLeadTypeIds.length) {
        await prisma.companyLeadBuyer.createMany({
          data: req.body.buyerLeadTypeIds.map((lid: string) => ({ companyProfileId: id, leadTypeId: lid })),
        });
      }
    }

    const full = await prisma.companyProfile.findUnique({
      where: { id },
      include: {
        industries: { include: { industrySegment: true } },
        asSupplier: { include: { leadType: true } },
        asBuyer: { include: { leadType: true } },
      },
    });
    return res.json(full);
  }
);

router.delete('/company-profiles/:id', [param('id').isString()], async (req: Request, res: Response) => {
  await prisma.companyProfile.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

// Lead types
router.get('/lead-types', async (_req: Request, res: Response) => {
  const list = await prisma.leadType.findMany({
    include: { industries: { include: { industrySegment: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(list);
});

router.post(
  '/lead-types',
  [
    body('name').trim().notEmpty(),
    body('category').isIn(['SERVICE', 'PRODUCT', 'CAPABILITY']),
    body('industrySegmentIds').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const slug = (req.body.name as string).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const leadType = await prisma.leadType.create({
      data: {
        name: req.body.name.trim(),
        category: req.body.category as LeadCategory,
        slug: slug || `lead-${Date.now()}`,
      },
    });
    if (req.body.industrySegmentIds?.length) {
      await prisma.leadTypeIndustry.createMany({
        data: req.body.industrySegmentIds.map((sid: string) => ({
          leadTypeId: leadType.id,
          industrySegmentId: sid,
        })),
      });
    }
    const full = await prisma.leadType.findUnique({
      where: { id: leadType.id },
      include: { industries: { include: { industrySegment: true } } },
    });
    return res.status(201).json(full);
  }
);

// Industry segments
router.get('/industry-segments', async (_req: Request, res: Response) => {
  const list = await prisma.industrySegment.findMany({ orderBy: { name: 'asc' } });
  return res.json(list);
});

router.post('/industry-segments', [body('name').trim().notEmpty()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const segment = await prisma.industrySegment.create({ data: { name: req.body.name.trim() } });
  return res.status(201).json(segment);
});

// Usage overview
router.get('/usage', async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
  const usage = await prisma.searchUsage.findMany({
    where: { year },
    include: { company: { select: { id: true, name: true, subscriptionPlan: true } } },
  });
  return res.json(usage);
});

export default router;
