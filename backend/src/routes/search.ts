import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany } from '../middleware/auth.js';
import { checkSearchLimit } from '../middleware/subscription.js';
import { config } from '../config.js';

const router = Router();
router.use(authMiddleware, requireCompany, checkSearchLimit);

// Match scoring interface
interface MatchScore {
  companyProfileId: string;
  score: number; // 0-100
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

// Calculate match score for a company
function calculateMatchScore(
  profile: any,
  filters: {
    leadTypeIds?: string[];
    industryIds?: string[];
    location?: string;
    certifications?: string[];
    companySize?: string;
  }
): MatchScore {
  let score = 0;
  const reasons: string[] = [];

  // Lead type match (40 points)
  if (filters.leadTypeIds && filters.leadTypeIds.length > 0) {
    const supplierLeadIds = profile.asSupplier.map((s: any) => s.leadTypeId);
    const buyerLeadIds = profile.asBuyer.map((b: any) => b.leadTypeId);
    const allLeadIds = [...supplierLeadIds, ...buyerLeadIds];
    const matchCount = filters.leadTypeIds.filter(id => allLeadIds.includes(id)).length;

    if (matchCount > 0) {
      const matchPercent = matchCount / filters.leadTypeIds.length;
      score += Math.floor(40 * matchPercent);
      reasons.push(`Matches ${matchCount}/${filters.leadTypeIds.length} requested service${filters.leadTypeIds.length > 1 ? 's' : ''}`);
    }
  }

  // Industry match (20 points)
  if (filters.industryIds && filters.industryIds.length > 0) {
    const profileIndustryIds = profile.industries.map((i: any) => i.industrySegmentId);
    const matchCount = filters.industryIds.filter(id => profileIndustryIds.includes(id)).length;

    if (matchCount > 0) {
      const matchPercent = matchCount / filters.industryIds.length;
      score += Math.floor(20 * matchPercent);
      reasons.push(`Serves ${matchCount} matching industr${matchCount > 1 ? 'ies' : 'y'}`);
    }
  }

  // Location match (15 points)
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    if (profile.city?.toLowerCase().includes(loc) ||
      profile.country?.toLowerCase().includes(loc) ||
      profile.state?.toLowerCase().includes(loc)) {
      score += 15;
      reasons.push(`Located in ${profile.city || profile.country}`);
    }
  }

  // Certification match (10 points)
  if (filters.certifications && filters.certifications.length > 0 && profile.certifications) {
    const profileCerts = profile.certifications.toLowerCase();
    const matchCount = filters.certifications.filter(cert =>
      profileCerts.includes(cert.toLowerCase())
    ).length;

    if (matchCount > 0) {
      score += Math.floor(10 * (matchCount / filters.certifications.length));
      reasons.push(`Has ${matchCount} matching certification${matchCount > 1 ? 's' : ''}`);
    }
  }

  // Company size preference (10 points)
  if (filters.companySize && profile.companySize === filters.companySize) {
    score += 10;
    reasons.push(`${profile.companySize} company`);
  }

  // Data completeness bonus (5 points)
  if (profile.dataCompleteness >= 80) {
    score += 5;
    reasons.push('Complete company profile');
  }

  // Determine confidence level
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  if (score >= 70) confidence = 'HIGH';
  else if (score >= 40) confidence = 'MEDIUM';
  else confidence = 'LOW';

  return {
    companyProfileId: profile.id,
    score,
    confidence,
    reasons,
  };
}

router.get(
  '/leads',
  [
    query('leadTypeIds').optional().isString(), // Comma-separated IDs
    query('companyType').optional().isIn(['SUPPLIER', 'BUYER', 'BOTH']),
    query('industryIds').optional().isString(), // Comma-separated IDs
    query('location').optional().isString(),
    query('keyword').optional().isString(),
    query('subCategory').optional().isString(),
    query('certifications').optional().isString(), // Comma-separated
    query('companySize').optional().isString(),
    query('exportCapability').optional().isBoolean(),
    query('filterLogic').optional().isIn(['AND', 'OR']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const companyId = req.user!.companyId;
    console.log('[SEARCH] Request for company:', companyId);

    if (!companyId && req.user!.role !== 'ADMIN') {
      console.log('[SEARCH] Missing companyId for non-admin');
      return res.status(403).json({ error: 'No company associated with this account' });
    }

    const company = companyId ? await prisma.company.findUnique({ where: { id: companyId } }) : null;
    console.log('[SEARCH] Company details:', company?.name, 'Plan:', company?.subscriptionPlan);

    const limits = company ? config.subscriptionLimits[company.subscriptionPlan] : null;
    const advancedFilters = limits?.advancedFilters ?? false;

    const {
      leadTypeIds: leadTypeIdsStr,
      companyType,
      industryIds: industryIdsStr,
      location,
      keyword,
      subCategory,
      certifications: certificationsStr,
      companySize,
      exportCapability,
      filterLogic = 'OR',
    } = req.query as Record<string, string | undefined>;

    const pageNum = parseInt(String(req.query.page ?? 1), 10);
    const limitNum = Math.min(parseInt(String(req.query.limit ?? 20), 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Parse multi-select filters
    const leadTypeIds = leadTypeIdsStr ? leadTypeIdsStr.split(',').filter(Boolean) : [];
    const industryIds = industryIdsStr ? industryIdsStr.split(',').filter(Boolean) : [];
    const certifications = certificationsStr ? certificationsStr.split(',').filter(Boolean) : [];

    const where: any = { isActive: true }; // Only show active companies

    let supplierIds: string[] = [];
    let buyerIds: string[] = [];

    // Multi-category lead type filtering
    if (leadTypeIds.length > 0) {
      const [suppliers, buyers] = await Promise.all([
        prisma.companyLeadSupplier.findMany({
          where: { leadTypeId: { in: leadTypeIds } },
          select: { companyProfileId: true },
        }),
        prisma.companyLeadBuyer.findMany({
          where: { leadTypeId: { in: leadTypeIds } },
          select: { companyProfileId: true },
        }),
      ]);
      supplierIds = [...new Set(suppliers.map((s) => s.companyProfileId))];
      buyerIds = [...new Set(buyers.map((b) => b.companyProfileId))];
    }

    if (leadTypeIds.length > 0) {
      if (companyType === 'SUPPLIER') {
        where.id = { in: supplierIds };
      } else if (companyType === 'BUYER') {
        where.id = { in: buyerIds };
      } else {
        where.id = { in: [...new Set([...supplierIds, ...buyerIds])] };
      }
    }

    if (advancedFilters) {
      if (companyType && leadTypeIds.length === 0) {
        where.category = companyType as 'SUPPLIER' | 'BUYER' | 'BOTH';
      }

      if (industryIds.length > 0) {
        where.industries = {
          some: { industrySegmentId: { in: industryIds } },
        };
      }

      if (location) {
        where.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } },
        ];
      }

      if (subCategory) {
        where.subCategory = { contains: subCategory, mode: 'insensitive' };
      }

      if (companySize) {
        where.companySize = companySize;
      }

      if (exportCapability !== undefined) {
        where.exportCapability = exportCapability === 'true';
      }
    }

    if (keyword) {
      const keywordConditions = [
        { companyName: { contains: keyword, mode: 'insensitive' } },
        { servicesOffered: { has: keyword } },
        { notes: { contains: keyword, mode: 'insensitive' } },
        { keyCapabilities: { has: keyword } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: keywordConditions }];
        delete where.OR;
      } else {
        where.OR = keywordConditions;
      }
    }

    const [profiles, total] = await Promise.all([
      prisma.companyProfile.findMany({
        where,
        include: {
          industries: { include: { industrySegment: true } },
          asSupplier: { include: { leadType: true } },
          asBuyer: { include: { leadType: true } },
        },
        orderBy: { dataCompleteness: 'desc' }, // Prioritize complete profiles
        skip,
        take: limitNum,
      }),
      prisma.companyProfile.count({ where }),
    ]);

    // Calculate match scores for all profiles
    const matches: MatchScore[] = profiles.map(profile =>
      calculateMatchScore(profile, {
        leadTypeIds,
        industryIds,
        location,
        certifications,
        companySize,
      })
    );

    // Sort profiles by match score
    const sortedIndices = matches
      .map((match, index) => ({ match, index }))
      .sort((a, b) => b.match.score - a.match.score)
      .map(item => item.index);

    const sortedProfiles = sortedIndices.map(i => profiles[i]);
    const sortedMatches = sortedIndices.map(i => matches[i]);

    // Get top 5 recommendations (highest scores)
    const recommendations = sortedProfiles.slice(0, 5);

    // Track search history
    if (companyId) {
      const now = new Date();

      // Increment search usage
      await prisma.company.update({
        where: { id: companyId },
        data: { searchesUsedThisMonth: { increment: 1 } },
      });

      await prisma.searchUsage.upsert({
        where: {
          companyId_year_month: {
            companyId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
        create: {
          companyId,
          userId: req.user!.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          count: 1,
        },
        update: { count: { increment: 1 }, userId: req.user!.id },
      });

      // Save to search history
      await prisma.searchHistory.create({
        data: {
          userId: req.user!.id,
          companyId,
          filters: {
            leadTypeIds,
            companyType,
            industryIds,
            location,
            keyword,
            subCategory,
            certifications,
            companySize,
            exportCapability,
          },
          resultCount: total,
        },
      }).catch(() => { }); // Non-critical, ignore errors
    }

    return res.json({
      data: sortedProfiles,
      matches: sortedMatches,
      recommendations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
);

router.get('/lead-types', async (_req: Request, res: Response) => {
  const types = await prisma.leadType.findMany({
    include: { industries: { include: { industrySegment: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(types);
});

router.get('/industry-segments', async (_req: Request, res: Response) => {
  const segments = await prisma.industrySegment.findMany({
    orderBy: { name: 'asc' },
  });
  return res.json(segments);
});

export default router;
