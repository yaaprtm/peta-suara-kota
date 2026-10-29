<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Logbook - <?php echo e($title ?? 'Logbook'); ?></title>
    <link rel="stylesheet" href="/css/dashboard.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dashboard-container detail-page-container" style="max-width:1100px;margin:18px auto;padding:18px;">
        <div class="detail-header">
            <div class="detail-header-actions">
                <a href="<?php echo e(route('dashboard.logbook-dpki')); ?>" class="btn-secondary"><i class="fa-solid fa-arrow-left"></i> Kembali</a>
            </div>
            <div class="detail-header-title">
                <h2>Detail Logbook <span>#<?php echo e($logbook->id_logbook); ?></span></h2>
            </div>
        </div>

        <div class="card" style="padding:18px;box-shadow:var(--shadow-soft);">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="font-size:0.95rem;color:var(--text-secondary)">Dibuat oleh: <strong style="color:var(--text-primary)"><?php echo e($logbook->user->nama_user ?? '-'); ?></strong></div>
                <div style="font-size:0.9rem;color:var(--text-secondary)"><?php echo e($logbook->created_at ? $logbook->created_at->format('d M Y, H:i') : '-'); ?></div>
            </div>

            <div class="detail-grid" style="margin-top:12px;">
                <div class="detail-card">
                    <h4>Petugas</h4>
                    <div style="margin-top:6px;">
                        <div><strong>Nama</strong><div><?php echo e($logbook->user->nama_user ?? '-'); ?></div></div>
                        <div style="margin-top:6px"><strong>Role</strong><div><?php echo e($logbook->user->role ?? '-'); ?></div></div>
                    </div>
                </div>

                <div class="detail-card">
                    <h4>Pohon / Tumbuhan</h4>
                    <div style="margin-top:6px;">
                        <div><strong>Nama Lokal</strong><div><?php echo e($logbook->nama_tumbuhan ?? ($logbook->tree->nama_lokal ?? '-')); ?></div></div>
                        <div style="margin-top:6px"><strong>Nama Ilmiah</strong><div><?php echo e($logbook->nama_jenis ?? ($logbook->tree->nama_jenis ?? '-')); ?></div></div>
                        <div style="margin-top:6px"><strong>Genus</strong><div><?php echo e($logbook->nama_genus ?? ($logbook->tree->genus ?? '-')); ?></div></div>
                    </div>
                </div>

                <div class="detail-card full">
                    <h4>Data Form yang Diisi</h4>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:8px;">
                        <div><small class="muted">Tanggal Kegiatan</small><div><?php echo e($logbook->create_at ?? $logbook->created_at); ?></div></div>
                        <div><small class="muted">Waktu</small><div><?php echo e($logbook->waktu ?? '-'); ?></div></div>
                        <div><small class="muted">Area</small><div><?php echo e($logbook->area ?? '-'); ?></div></div>
                        <div><small class="muted">Vak Koleksi</small><div><?php echo e($logbook->vak_koleksi ?? '-'); ?></div></div>
                        <div><small class="muted">No. Vak</small><div><?php echo e($logbook->no_vak ?? '-'); ?></div></div>
                        <div><small class="muted">Koordinat</small><div>Lat: <?php echo e($logbook->latitude ?? '-'); ?>, Lng: <?php echo e($logbook->longitude ?? '-'); ?></div></div>
                        <div><small class="muted">Jenis Kegiatan</small><div><?php echo e($logbook->jenis_kegiatan ?? '-'); ?></div></div>
                        <div><small class="muted">Kondisi Tumbuhan</small><div><?php echo e($logbook->kondisi_tumbuhan ?? '-'); ?></div></div>
                    </div>
                </div>

                <div class="detail-card full">
                    <h4>Detail Kondisi Tumbuhan</h4>
                    <?php if($logbook->kondisi_tumbuhan === 'Sehat'): ?>
                        <div style="margin-bottom:12px;">
                            <strong>Dokumentasi Kegiatan (Sehat)</strong>
                            <div style="margin-top:8px;">
                                <?php if($logbook->dokumentasi_kegiatan_sehat): ?>
                                    <a href="/<?php echo e($logbook->dokumentasi_kegiatan_sehat); ?>" target="_blank"><img src="/<?php echo e($logbook->dokumentasi_kegiatan_sehat); ?>" style="max-width:100%;border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-soft);" alt="Dokumentasi Sehat"></a>
                                <?php else: ?>
                                    <span>- Tidak ada dokumentasi sehat -</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php elseif($logbook->kondisi_tumbuhan === 'Sakit/Merana'): ?>
                        <div style="margin-bottom:12px;"><strong>Tingkat Sakit</strong><div><?php echo e($logbook->tingkat_sakit ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Kategori Sakit</strong><div><?php echo e($logbook->kategori_sakit ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Penyebab</strong><div><?php echo e($logbook->penyebab_sakit ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Penanganan Koleksi</strong><div><?php echo e($logbook->penanganan_koleksi_sakit ?? '-'); ?></div></div>
                        <div style="margin-top:8px;"><strong>Dokumentasi</strong>
                            <div style="margin-top:8px;">
                                <?php if($logbook->dokumentasi_kegiatan): ?>
                                    <a href="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" target="_blank"><img src="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" style="max-width:100%;border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-soft);" alt="Dokumentasi Sakit"></a>
                                <?php else: ?>
                                    <span>- Tidak ada dokumentasi -</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php elseif($logbook->kondisi_tumbuhan === 'Rawan'): ?>
                        <div style="margin-bottom:12px;"><strong>Kategori Rawan</strong><div><?php echo e($logbook->kategori_rawan ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Penanganan Koleksi</strong><div><?php echo e($logbook->penanganan_koleksi_sakit ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Penanganan Tumbuhan Rawan</strong><div><?php echo e($logbook->penanganan_tumbuhan_rawan ?? '-'); ?></div></div>
                        <div style="margin-top:8px;"><strong>Dokumentasi</strong>
                            <div style="margin-top:8px;">
                                <?php if($logbook->dokumentasi_kegiatan): ?>
                                    <a href="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" target="_blank"><img src="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" style="max-width:100%;border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-soft);" alt="Dokumentasi Rawan"></a>
                                <?php else: ?>
                                    <span>- Tidak ada dokumentasi -</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php elseif($logbook->kondisi_tumbuhan === 'Mati'): ?>
                        <div style="margin-bottom:12px;"><strong>Kondisi Koleksi Mati</strong><div><?php echo e($logbook->kondisi_koleksi_mati ?? '-'); ?></div></div>
                        <div style="margin-bottom:12px;"><strong>Dokumentasi</strong>
                            <div style="margin-top:8px;">
                                <?php if($logbook->dokumentasi_kegiatan): ?>
                                    <a href="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" target="_blank"><img src="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" style="max-width:100%;border-radius:10px;border:1px solid var(--border-color);box-shadow:var(--shadow-soft);" alt="Dokumentasi Mati"></a>
                                <?php else: ?>
                                    <span>- Tidak ada dokumentasi -</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php else: ?>
                        <div><span>- Tidak ada detail kondisi tumbuhan khusus -</span></div>
                    <?php endif; ?>
                </div>

                <div class="detail-card">
                    <h4>Kondisi Label & Pemeliharaan</h4>
                    <div style="margin-top:6px;">
                        <div><strong>Label Mekolin</strong><div><?php echo e($logbook->kondisi_label_mekolin ?? '-'); ?></div></div>
                        <div style="margin-top:6px"><strong>Label Seng</strong><div><?php echo e($logbook->kondisi_label_seng ?? '-'); ?></div></div>
                        <div style="margin-top:6px"><strong>Pemeliharaan Label</strong><div><?php echo e($logbook->pemeliharaan_label ?? '-'); ?></div></div>
                    </div>
                </div>

                <div class="detail-card">
                    <h4>Tumbuhan Mati (jika ada)</h4>
                    <div style="margin-top:6px;">
                        <div><strong>Kondisi Koleksi Mati</strong><div><?php echo e($logbook->kondisi_koleksi_mati ?? '-'); ?></div></div>
                        <div style="margin-top:8px"><strong>Dokumentasi</strong>
                            <div style="margin-top:6px">
                                <?php if($logbook->dokumentasi_kegiatan): ?>
                                    <a href="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" target="_blank"><img src="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" style="max-width:360px;border-radius:8px;border:1px solid var(--border-color);box-shadow:var(--shadow-soft);" /></a>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-card full">
                    <h4>Lainnya</h4>
                    <div style="margin-top:8px"><?php echo e($logbook->kegiatan_lain ?? '-'); ?></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html><?php /**PATH C:\laragon\www\baru\resources\views/logbook_show.blade.php ENDPATH**/ ?>