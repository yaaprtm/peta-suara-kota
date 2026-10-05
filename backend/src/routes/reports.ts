import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { analyzeUrgency } from '../services/urgencyScorer';
import { upload } from '../services/fileUpload';
import { sseService } from '../services/sse';
import { ReportCategory, ReportStatus, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export const reportsRouter = Router();

// ─── Batasan Geografis Wilayah Surabaya ───────────────────────────────────────
const SURABAYA_BOUNDS = {
  minLat: -7.45,
  maxLat: -7.10,
  minLng: 112.50,
  maxLng: 112.95,
};

// ─── SSE Stream ───────────────────────────────────────────────────────────────

reportsRouter.get('/stream', (req: Request, res: Response) => {
  const clientId = uuidv4();
  sseService.addClient(clientId, res);
});

// ─── GET /reports/viewport (Skala Surabaya) ───────────────────────────────────

reportsRouter.get(
  '/viewport',
  [
    query('bbox').optional().isString(),
    query('zoom').optional().isFloat(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('category').optional().isIn(Object.values(ReportCategory)),
    query('status').optional().isIn(Object.values(ReportStatus)),
    query('kecamatan').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        bbox,
        zoom,
        limit = 300,
        startDate,
        endDate,
        category,
        status,
        kecamatan,
      } = req.query as Record<string, string>;

      const where: Record<string, unknown> = {};

      if (bbox) {
        const parts = bbox.split(',').map(Number);
        if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
          const [minLng, minLat, maxLng, maxLat] = parts;
          where.latitude = {
            gte: Math.min(minLat, maxLat),
            lte: Math.max(minLat, maxLat),
          };
          where.longitude = {
            gte: Math.min(minLng, maxLng),
            lte: Math.max(minLng, maxLng),
          };
        }
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          (where.createdAt as Record<string, unknown>).lte = end;
        }
      }

      if (category) where.category = category;
      if (status) where.status = status;
      if (kecamatan) {
        where.kelurahan = { kecamatan };
      }

      const takeLimit = Math.min(parseInt(String(limit), 10) || 300, 500);

      const reports = await prisma.report.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          kelurahan: { select: { id: true, name: true, kecamatan: true } },
        },
        orderBy: [{ skorUrgensi: 'desc' }, { createdAt: 'desc' }],
        take: takeLimit,
      });

      return res.json({
        reports,
        count: reports.length,
        zoom: zoom ? parseFloat(zoom) : undefined,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /reports ─────────────────────────────────────────────────────────────

reportsRouter.get(
  '/',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('category').optional().isIn(Object.values(ReportCategory)),
    query('status').optional().isIn(Object.values(ReportStatus)),
    query('kelurahanId').optional().isUUID(),
    query('kecamatan').optional().isString(),
    query('minScore').optional().isInt({ min: 0, max: 100 }),
    query('maxScore').optional().isInt({ min: 0, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        startDate, endDate, category, status,
        kelurahanId, kecamatan, minScore, maxScore,
        page = 1, limit = 100,
      } = req.query as Record<string, string>;

      const where: Record<string, unknown> = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          (where.createdAt as Record<string, unknown>).lte = end;
        }
      }

      if (category) where.category = category;
      if (status) where.status = status;
      if (kelurahanId) where.kelurahanId = kelurahanId;
      if (kecamatan) {
        where.kelurahan = { kecamatan };
      }

      if (minScore || maxScore) {
        where.skorUrgensi = {};
        if (minScore) (where.skorUrgensi as Record<string, unknown>).gte = parseInt(minScore);
        if (maxScore) (where.skorUrgensi as Record<string, unknown>).lte = parseInt(maxScore);
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            kelurahan: { select: { id: true, name: true, kecamatan: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(String(limit)),
          skip: (parseInt(String(page)) - 1) * parseInt(String(limit)),
        }),
        prisma.report.count({ where }),
      ]);

      return res.json({
        reports,
        pagination: {
          total,
          page: parseInt(String(page)),
          limit: parseInt(String(limit)),
          pages: Math.ceil(total / parseInt(String(limit))),
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /reports/:id ─────────────────────────────────────────────────────────

reportsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        kelurahan: true,
        statusLogs: {
          include: { changedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { changedAt: 'asc' },
        },
        categoryRef: true,
      },
    });

    if (!report) return next(new AppError('Laporan tidak ditemukan', 404));

    return res.json({ report });
  } catch (err) {
    return next(err);
  }
});

// ─── POST /reports (create report) ───────────────────────────────────────────

reportsRouter.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'photos', maxCount: 4 },
    { name: 'audio', maxCount: 1 },
  ]),
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('description').trim().isLength({ min: 10 }),
    body('category').isIn(Object.values(ReportCategory)),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Data tidak valid: ' + errors.array().map(e => e.msg).join(', '), 400));
    }

    try {
      const { title, description, category, latitude, longitude, address, kelurahanId, audioTranscript } = req.body;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Validasi Bounding Box Surabaya: tolak laporan yang berada di luar wilayah Surabaya
      if (
        lat < SURABAYA_BOUNDS.minLat ||
        lat > SURABAYA_BOUNDS.maxLat ||
        lng < SURABAYA_BOUNDS.minLng ||
        lng > SURABAYA_BOUNDS.maxLng
      ) {
        return next(
          new AppError(
            'Koordinat lokasi laporan berada di luar cakupan wilayah Surabaya. Silakan pilih titik lokasi di dalam area Surabaya.',
            400
          )
        );
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const photoFiles = files?.photos || [];
      const audioFile = files?.audio?.[0];

      // Build paths relative to uploads dir for storage
      const photos = photoFiles.map(f => {
        const subDir = 'photos';
        return `${subDir}/${f.filename}`;
      });
      const audioUrl = audioFile ? `audio/${audioFile.filename}` : undefined;

      // Run urgency analysis on full text
      const textToAnalyze = `${title} ${description} ${audioTranscript || ''}`;
      const { skorUrgensi, urgensiKeywords } = analyzeUrgency(textToAnalyze, category as ReportCategory);

      const report = await prisma.report.create({
        data: {
          title,
          description,
          category: category as ReportCategory,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address || null,
          kelurahanId: kelurahanId || null,
          photos,
          audioUrl: audioUrl || null,
          audioTranscript: audioTranscript || null,
          skorUrgensi,
          urgensiKeywords,
          userId: req.user!.id,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          kelurahan: { select: { id: true, name: true, kecamatan: true } },
        },
      });

      // Create initial status log
      await prisma.statusLog.create({
        data: {
          reportId: report.id,
          fromStatus: null,
          toStatus: ReportStatus.BARU,
          note: 'Laporan diterima oleh sistem',
          changedById: req.user!.id,
        },
      });

      // Broadcast to SSE clients
      sseService.broadcastNewReport(report);

      return res.status(201).json({
        message: 'Laporan berhasil dibuat',
        report,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── PATCH /reports/:id/status (petugas/admin only) ──────────────────────────

reportsRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.PETUGAS, UserRole.ADMIN),
  [
    body('status').isIn(Object.values(ReportStatus)),
    body('note').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Status tidak valid', 400));
    }

    try {
      const { status, note } = req.body;
      const reportId = req.params.id;

      const report = await prisma.report.findUnique({ where: { id: reportId } });
      if (!report) return next(new AppError('Laporan tidak ditemukan', 404));

      const [updatedReport] = await Promise.all([
        prisma.report.update({
          where: { id: reportId },
          data: { status: status as ReportStatus },
          include: {
            user: { select: { id: true, name: true } },
            kelurahan: { select: { id: true, name: true } },
          },
        }),
        prisma.statusLog.create({
          data: {
            reportId,
            fromStatus: report.status,
            toStatus: status as ReportStatus,
            note: note || null,
            changedById: req.user!.id,
          },
        }),
      ]);

      sseService.broadcastStatusUpdate(reportId, status);

      return res.json({
        message: 'Status berhasil diperbarui',
        report: updatedReport,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── DELETE /reports/:id ──────────────────────────────────────────────────────

reportsRouter.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const report = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (!report) return next(new AppError('Laporan tidak ditemukan', 404));

      // Only owner or admin can delete
      if (report.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        return next(new AppError('Tidak memiliki akses', 403));
      }

      await prisma.report.delete({ where: { id: req.params.id } });

      return res.json({ message: 'Laporan berhasil dihapus' });
    } catch (err) {
      return next(err);
    }
  }
);
