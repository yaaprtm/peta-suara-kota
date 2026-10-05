import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const kelurahansRouter = Router();

kelurahansRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kelurahans = await prisma.kelurahan.findMany({
      orderBy: [{ kecamatan: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { reports: true } },
      },
    });
    return res.json({ kelurahans });
  } catch (err) {
    return next(err);
  }
});

kelurahansRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kelurahan = await prisma.kelurahan.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { reports: true } },
      },
    });
    if (!kelurahan) return res.status(404).json({ message: 'Kelurahan tidak ditemukan' });
    return res.json({ kelurahan });
  } catch (err) {
    return next(err);
  }
});
