import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get all comparisons for current user
router.get('/', async (req: Request, res: Response) => {
    const comparisons = await prisma.companyComparison.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
    });
    return res.json(comparisons);
});

// Get comparison details with full company data
router.get('/:id', [param('id').isString()], async (req: Request, res: Response) => {
    const { id } = req.params;

    const comparison = await prisma.companyComparison.findUnique({
        where: { id },
    });

    if (!comparison) {
        return res.status(404).json({ error: 'Comparison not found' });
    }

    if (comparison.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch full company profiles
    const companies = await prisma.companyProfile.findMany({
        where: {
            id: { in: comparison.companyProfileIds },
        },
        include: {
            industries: { include: { industrySegment: true } },
            asSupplier: { include: { leadType: true } },
            asBuyer: { include: { leadType: true } },
        },
    });

    return res.json({
        ...comparison,
        companies,
    });
});

// Create comparison
router.post(
    '/',
    [
        body('name').isString().notEmpty(),
        body('companyProfileIds').isArray().custom((arr) => arr.length >= 2 && arr.length <= 3),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, companyProfileIds } = req.body;

        const comparison = await prisma.companyComparison.create({
            data: {
                userId: req.user!.id,
                name,
                companyProfileIds,
            },
        });
        return res.status(201).json(comparison);
    }
);

// Delete comparison
router.delete('/:id', [param('id').isString()], async (req: Request, res: Response) => {
    const { id } = req.params;

    const comparison = await prisma.companyComparison.findUnique({ where: { id } });
    if (!comparison) {
        return res.status(404).json({ error: 'Comparison not found' });
    }

    if (comparison.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.companyComparison.delete({ where: { id } });
    return res.status(204).send();
});

export default router;
