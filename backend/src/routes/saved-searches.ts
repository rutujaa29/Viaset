import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, requireCompany);

router.get('/', async (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const list = await prisma.savedSearch.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(list);
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('filters').isObject(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const companyId = req.user!.companyId!;
    const { name, filters } = req.body;

    const saved = await prisma.savedSearch.create({
      data: {
        name,
        filters,
        companyId,
        userId: req.user!.id,
      },
    });
    return res.status(201).json(saved);
  }
);

router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const companyId = req.user!.companyId!;
    const { id } = req.params;
    await prisma.savedSearch.deleteMany({
      where: { id, companyId },
    });
    return res.status(204).send();
  }
);

export default router;
