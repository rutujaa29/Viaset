import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireCompany } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();
router.use(authMiddleware, requireCompany);

function canExport(plan: string): boolean {
  const limits = config.subscriptionLimits[plan];
  return limits?.export ?? false;
}

router.post(
  '/',
  [
    body('format').isIn(['csv', 'xlsx']),
    body('ids').isArray(),
    body('ids.*').isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const companyId = req.user!.companyId!;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Company not found' });
    }
    if (req.user!.role !== 'ADMIN' && company && !canExport(company.subscriptionPlan)) {
      return res.status(403).json({
        error: 'Export is not available on your plan. Please upgrade to Pro or Enterprise.',
      });
    }

    const { format, ids } = req.body as { format: 'csv' | 'xlsx'; ids: string[] };
    const limit = 5000;
    const idList = ids.slice(0, limit);

    const profiles = await prisma.companyProfile.findMany({
      where: { id: { in: idList } },
      include: {
        industries: { include: { industrySegment: true } },
        asSupplier: { include: { leadType: true } },
        asBuyer: { include: { leadType: true } },
      },
    });

    const rows = profiles.map((p) => ({
      'Company Name': p.companyName,
      Category: p.category,
      'Sub-category': p.subCategory ?? '',
      'Services Offered': p.servicesOffered.join('; '),
      'Industries Served': p.industriesServed.join('; '),
      Email: p.email ?? '',
      Phone: p.phone ?? '',
      Website: p.website ?? '',
      City: p.city ?? '',
      State: p.state ?? '',
      Country: p.country ?? '',
      Certifications: p.certifications ?? '',
      'Company Size': p.companySize ?? '',
      'Supplies (Lead Types)': p.asSupplier.map((s) => s.leadType.name).join('; '),
      'Needs (Lead Types)': p.asBuyer.map((b) => b.leadType.name).join('; '),
      Notes: (p.notes ?? '').slice(0, 500),
    }));

    if (format === 'csv') {
      const csv = stringify(rows, { header: true });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="companies-export-${Date.now()}.csv"`);
      return res.send(csv);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="companies-export-${Date.now()}.xlsx"`);
    return res.send(buf);
  }
);

export default router;
