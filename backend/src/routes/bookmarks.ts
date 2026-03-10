import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get all bookmarks for current user
router.get('/', async (req: Request, res: Response) => {
    const bookmarks = await prisma.bookmark.findMany({
        where: { userId: req.user!.id },
        include: {
            companyProfile: {
                include: {
                    industries: { include: { industrySegment: true } },
                    asSupplier: { include: { leadType: true } },
                    asBuyer: { include: { leadType: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return res.json(bookmarks);
});

// Add bookmark
router.post(
    '/',
    [body('companyProfileId').isString().notEmpty()],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { companyProfileId } = req.body;

        try {
            const bookmark = await prisma.bookmark.create({
                data: {
                    userId: req.user!.id,
                    companyProfileId,
                },
                include: {
                    companyProfile: true,
                },
            });
            return res.status(201).json(bookmark);
        } catch (error: any) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: 'Company already bookmarked' });
            }
            throw error;
        }
    }
);

// Remove bookmark
router.delete('/:id', [param('id').isString()], async (req: Request, res: Response) => {
    const { id } = req.params;

    const bookmark = await prisma.bookmark.findUnique({ where: { id } });
    if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }

    if (bookmark.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.bookmark.delete({ where: { id } });
    return res.status(204).send();
});

export default router;
