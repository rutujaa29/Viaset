import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Company User Analytics
router.get('/top-categories', requireCompany, async (req: Request, res: Response) => {
    const companyId = req.user!.companyId!;

    // Get search history for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchHistory = await prisma.searchHistory.findMany({
        where: {
            companyId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: { filters: true },
    });

    // Count lead type occurrences
    const leadTypeCounts: Record<string, number> = {};
    for (const search of searchHistory) {
        const filters = search.filters as any;
        if (filters.leadTypeIds && Array.isArray(filters.leadTypeIds)) {
            for (const id of filters.leadTypeIds) {
                leadTypeCounts[id] = (leadTypeCounts[id] || 0) + 1;
            }
        }
    }

    // Get top 5
    const topIds = Object.entries(leadTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

    const leadTypes = await prisma.leadType.findMany({
        where: { id: { in: topIds } },
    });

    const result = leadTypes.map(lt => ({
        ...lt,
        searchCount: leadTypeCounts[lt.id],
    }));

    return res.json(result);
});

router.get('/recent-views', requireCompany, async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Get recent search history
    const recentSearches = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return res.json(recentSearches);
});

router.get('/usage-summary', requireCompany, async (req: Request, res: Response) => {
    const companyId = req.user!.companyId!;

    const [company, exportCount, searchCount] = await Promise.all([
        prisma.company.findUnique({
            where: { id: companyId },
            select: {
                searchesUsedThisMonth: true,
                searchLimitMonth: true,
                subscriptionPlan: true,
            },
        }),
        prisma.exportHistory.count({ where: { companyId } }),
        prisma.searchHistory.count({ where: { companyId } }),
    ]);

    return res.json({
        searchesUsed: company?.searchesUsedThisMonth || 0,
        searchLimit: company?.searchLimitMonth,
        subscriptionPlan: company?.subscriptionPlan,
        totalExports: exportCount,
        totalSearches: searchCount,
    });
});

// Admin Analytics
router.get('/admin/overview', requireRole('ADMIN'), async (req: Request, res: Response) => {
    const [totalCompanies, activeCompanies, totalSubscriptions, companyCount] = await Promise.all([
        prisma.companyProfile.count(),
        prisma.companyProfile.count({ where: { isActive: true } }),
        prisma.company.count(),
        prisma.company.groupBy({
            by: ['subscriptionPlan'],
            _count: true,
        }),
    ]);

    return res.json({
        totalCompanies,
        activeCompanies,
        totalSubscriptions,
        subscriptionBreakdown: companyCount,
    });
});

router.get('/admin/category-coverage', requireRole('ADMIN'), async (req: Request, res: Response) => {
    const leadTypes = await prisma.leadType.findMany({
        include: {
            _count: {
                select: {
                    suppliers: true,
                    buyers: true,
                },
            },
        },
    });

    const coverage = leadTypes.map(lt => ({
        id: lt.id,
        name: lt.name,
        category: lt.category,
        supplierCount: lt._count.suppliers,
        buyerCount: lt._count.buyers,
        totalCount: lt._count.suppliers + lt._count.buyers,
    }));

    return res.json(coverage);
});

router.get('/admin/popular-searches', requireRole('ADMIN'), async (req: Request, res: Response) => {
    const searchHistory = await prisma.searchHistory.findMany({
        select: { filters: true },
        take: 1000,
        orderBy: { createdAt: 'desc' },
    });

    const leadTypeCounts: Record<string, number> = {};
    for (const search of searchHistory) {
        const filters = search.filters as any;
        if (filters.leadTypeIds && Array.isArray(filters.leadTypeIds)) {
            for (const id of filters.leadTypeIds) {
                leadTypeCounts[id] = (leadTypeCounts[id] || 0) + 1;
            }
        }
    }

    const topIds = Object.entries(leadTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

    const leadTypes = await prisma.leadType.findMany({
        where: { id: { in: topIds } },
    });

    const result = leadTypes.map(lt => ({
        ...lt,
        searchCount: leadTypeCounts[lt.id],
    }));

    return res.json(result);
});

router.get('/admin/data-quality', requireRole('ADMIN'), async (req: Request, res: Response) => {
    const profiles = await prisma.companyProfile.findMany({
        select: { dataCompleteness: true },
    });

    const avgCompleteness = profiles.reduce((sum, p) => sum + p.dataCompleteness, 0) / profiles.length;

    const distribution = {
        high: profiles.filter(p => p.dataCompleteness >= 80).length,
        medium: profiles.filter(p => p.dataCompleteness >= 50 && p.dataCompleteness < 80).length,
        low: profiles.filter(p => p.dataCompleteness < 50).length,
    };

    return res.json({
        averageCompleteness: Math.round(avgCompleteness),
        distribution,
        totalProfiles: profiles.length,
    });
});

export default router;
