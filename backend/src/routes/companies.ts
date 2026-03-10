import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, requireCompany);

router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;

    const profile = await prisma.companyProfile.findUnique({
      where: { id },
      include: {
        industries: { include: { industrySegment: true } },
        asSupplier: { include: { leadType: true } },
        asBuyer: { include: { leadType: true } },
      },
    });
    if (!profile) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json(profile);
  }
);

export default router;
