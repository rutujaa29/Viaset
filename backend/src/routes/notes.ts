import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get notes for a company
router.get(
    '/',
    [query('companyProfileId').optional().isString()],
    async (req: Request, res: Response) => {
        const { companyProfileId } = req.query;

        const where: any = { userId: req.user!.id };
        if (companyProfileId) {
            where.companyProfileId = companyProfileId;
        }

        const notes = await prisma.companyNote.findMany({
            where,
            include: {
                companyProfile: {
                    select: {
                        id: true,
                        companyName: true,
                        category: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return res.json(notes);
    }
);

// Create note
router.post(
    '/',
    [
        body('companyProfileId').isString().notEmpty(),
        body('content').isString().notEmpty(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { companyProfileId, content } = req.body;

        const note = await prisma.companyNote.create({
            data: {
                userId: req.user!.id,
                companyProfileId,
                content,
            },
            include: {
                companyProfile: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        return res.status(201).json(note);
    }
);

// Update note
router.patch(
    '/:id',
    [
        param('id').isString(),
        body('content').isString().notEmpty(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { content } = req.body;

        const note = await prisma.companyNote.findUnique({ where: { id } });
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (note.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.companyNote.update({
            where: { id },
            data: { content },
            include: {
                companyProfile: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
);

// Delete note
router.delete('/:id', [param('id').isString()], async (req: Request, res: Response) => {
    const { id } = req.params;

    const note = await prisma.companyNote.findUnique({ where: { id } });
    if (!note) {
        return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.companyNote.delete({ where: { id } });
    return res.status(204).send();
});

export default router;
