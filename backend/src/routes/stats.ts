import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ReportStatus } from '@prisma/client';

export const statsRouter = Router();

// ─── Leaderboard: Kelurahan response time ranking ────────────────────────────

statsRouter.get('/leaderboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kelurahans = await prisma.kelurahan.findMany({
      include: {
        reports: {
          include: {
            statusLogs: {
              orderBy: { changedAt: 'asc' },
            },
          },
        },
      },
    });

    const leaderboard = kelurahans.map(k => {
      const reports = k.reports;
      const totalReports = reports.length;
      const resolvedReports = reports.filter(r => r.status === ReportStatus.SELESAI);

      // Calculate average response time (BARU → DIPROSES)
      let totalResponseMs = 0;
      let responseCount = 0;

      for (const report of reports) {
        const baru = report.statusLogs.find(l => l.toStatus === ReportStatus.BARU);
        const diproses = report.statusLogs.find(l => l.toStatus === ReportStatus.DIPROSES);
        if (baru && diproses) {
          totalResponseMs += diproses.changedAt.getTime() - baru.changedAt.getTime();
          responseCount++;
        }
      }

      const avgResponseMs = responseCount > 0 ? totalResponseMs / responseCount : null;
      const avgResponseHours = avgResponseMs ? avgResponseMs / 3600000 : null;

      // Calculate resolution rate
      const resolutionRate = totalReports > 0 ? resolvedReports.length / totalReports : 0;

      // Score: lower response time = higher score, but needs at least some reports
      const score = totalReports > 0
        ? Math.round(
            (resolutionRate * 50) +
            (avgResponseHours !== null
              ? Math.max(0, 50 - Math.min(50, avgResponseHours / 2))
              : 0)
          )
        : 0;

      return {
        kelurahan: {
          id: k.id,
          name: k.name,
          kecamatan: k.kecamatan,
          kota: k.kota,
        },
        totalReports,
        resolvedReports: resolvedReports.length,
        resolutionRate: Math.round(resolutionRate * 100),
        avgResponseHours: avgResponseHours ? Math.round(avgResponseHours * 10) / 10 : null,
        score,
      };
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    return res.json({ leaderboard });
  } catch (err) {
    return next(err);
  }
});

// ─── Overview stats ───────────────────────────────────────────────────────────

statsRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, baru, diproses, selesai, highUrgency] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.BARU } }),
      prisma.report.count({ where: { status: ReportStatus.DIPROSES } }),
      prisma.report.count({ where: { status: ReportStatus.SELESAI } }),
      prisma.report.count({ where: { skorUrgensi: { gte: 70 } } }),
    ]);

    // Last 14 days activity
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentReports = await prisma.report.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true, category: true, skorUrgensi: true },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const r of recentReports) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (key in byDay) byDay[key]++;
    }

    return res.json({
      total,
      baru,
      diproses,
      selesai,
      highUrgency,
      byDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    return next(err);
  }
});
