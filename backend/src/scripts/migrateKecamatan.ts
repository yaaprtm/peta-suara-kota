import { prisma } from '../lib/prisma';
import { determineKecamatan } from '../lib/kecamatan';

/**
 * Skrip migrasi sekali jalan untuk mengisi field kecamatan
 * pada semua laporan yang belum memiliki kecamatan berdasarkan koordinat point-in-polygon.
 */
async function migrateReportsKecamatan() {
  console.log('--- Memulai migrasi field kecamatan laporan lama ---');
  
  const reports = await prisma.report.findMany({
    select: {
      id: true,
      latitude: true,
      longitude: true,
      kecamatan: true,
      kelurahan: { select: { kecamatan: true } },
    },
  });

  console.log(`Ditemukan ${reports.length} total laporan.`);
  let updatedCount = 0;
  let outsideCount = 0;

  for (const report of reports) {
    if (!report.kecamatan) {
      const detected = determineKecamatan(report.longitude, report.latitude);
      const finalKecamatan = detected || report.kelurahan?.kecamatan || 'tidak diketahui';
      
      if (!detected && !report.kelurahan?.kecamatan) {
        outsideCount++;
        console.warn(`Laporan ${report.id} di luar poligon Surabaya (${report.longitude}, ${report.latitude}) -> ditandai 'tidak diketahui'`);
      }

      await prisma.report.update({
        where: { id: report.id },
        data: { kecamatan: finalKecamatan },
      });

      updatedCount++;
    }
  }

  console.log(`Migrasi selesai: ${updatedCount} laporan diperbarui (${outsideCount} di luar Surabaya).`);
}

migrateReportsKecamatan()
  .catch((err) => {
    console.error('Error migrasi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
