<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo e($title); ?></title>
    <link rel="stylesheet" href="/css/dashboard.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/js/sidebar.js"></script>
    <script src="/js/preferences.js"></script>
    <style>
        
    </style>
</head>
<body>

    <div class="dashboard-container">

        <!-- ================= SIDEBAR ================= -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <img src="/logo-kebun-raya.png" alt="Kebun Raya Cibinong" class="sidebar-logo">
                </div>
            </div>

            <!-- Quick Links -->
            <div class="quick-links">
                <p class="quick-links-title" data-i18n="quick_links">Quick Links</p>
                <div class="quick-links-icons">
                    <a href="<?php echo e(route('dashboard.leaderboard')); ?>" class="quick-icon <?php echo e(Request::is('dashboard/leaderboard*') ? 'active' : ''); ?>" title="Trophy">
                        <i class="fa-solid fa-trophy"></i>
                    </a>
                    <a href="<?php echo e(route('dashboard.settings')); ?>" class="quick-icon <?php echo e(Request::is('dashboard/settings*') ? 'active' : ''); ?>" title="Settings">
                        <i class="fa-solid fa-gear"></i>
                    </a>
                    <a href="<?php echo e(route('dashboard.media')); ?>" class="quick-icon <?php echo e(Request::is('dashboard/media*') ? 'active' : ''); ?>" title="Folder">
                        <i class="fa-solid fa-folder"></i>
                    </a>
                </div>
            </div>

            <nav class="sidebar-menu">
                <p class="menu-category" data-i18n="main_menu">Main Menu</p>
                <a href="/dashboard" class="menu-item">
                    <span class="menu-item-left" data-i18n="nav_overview"><i class="fa-solid fa-chart-pie"></i> Overview</span>
                </a>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-info-artikel')): ?>
                <a href="<?php echo e(route('dashboard.artikel')); ?>" class="menu-item">
                    <span class="menu-item-left" data-i18n="nav_artikel"><i class="fa-solid fa-newspaper"></i> Info Artikel</span>
                </a>
                <?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-laporan')): ?>
<a href="/dashboard/laporan" class="menu-item">
                    <span class="menu-item-left" data-i18n="nav_laporan"><i class="fa-solid fa-file-invoice"></i> Laporan</span>
                    <div style="display: flex; gap: 4px;">
                        <?php if($pending > 0): ?>
                            <span class="menu-badge" style="background-color: #f97316;" title="Pending"><?php echo e($pending); ?></span>
                        <?php endif; ?>
                        <?php if($diproses > 0): ?>
                            <span class="menu-badge" style="background-color: #3b82f6;" title="Diproses"><?php echo e($diproses); ?></span>
                        <?php endif; ?>
                        <?php if($selesai > 0): ?>
                            <span class="menu-badge" style="background-color: #10b981;" title="Selesai"><?php echo e($selesai); ?></span>
                        <?php endif; ?>
                        <?php if($ditolak > 0): ?>
                            <span class="menu-badge" style="background-color: #ef4444;" title="Ditolak"><?php echo e($ditolak); ?></span>
                        <?php endif; ?>
                    </div>
                </a>
<?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('manage-users')): ?>
                <a href="<?php echo e(route('dashboard.pengguna')); ?>" class="menu-item">
                    <span class="menu-item-left" data-i18n="nav_pengguna"><i class="fa-solid fa-users"></i> Pengguna</span>
                </a>
                <?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-tree')): ?>
<a href="<?php echo e(route('dashboard.tree')); ?>" class="menu-item">
                    <span class="menu-item-left"><i class="fa-solid fa-tree"></i> Tree (Pohon)</span>
                </a>
<?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-logbook')): ?>
<a href="<?php echo e(route('dashboard.logbook-dpki')); ?>" class="menu-item active">
                    <span class="menu-item-left"><i class="fa-solid fa-book"></i> Logbook DPKI</span>
                </a>
<?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-berita')): ?>
<a href="<?php echo e(route('dashboard.berita')); ?>" class="menu-item <?php echo e(Request::is('dashboard/berita*') ? 'active' : ''); ?>">
                    <span class="menu-item-left"><i class="fa-solid fa-bullhorn"></i> Berita</span>
                </a>
<?php endif; ?>
            </nav>

            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="avatar"><?php echo e(substr(auth()->user()->nama_user ?? 'R', 0, 1)); ?></div>
                    <div class="user-details">
                        <span class="user-name"><?php echo e(auth()->user()->nama_user ?? 'root'); ?></span>
                        <span class="user-role"><?php echo e(ucfirst(auth()->user()->role ?? 'admin')); ?></span>
                    </div>
                </div>
                <form action="/logout" method="POST" style="margin: 0; padding: 0;">
                    <?php echo csrf_field(); ?>
                    <button type="submit" class="logout-btn" data-i18n="nav_keluar"><i class="fa-solid fa-right-from-bracket"></i> Keluar</button>
                </form>
            </div>
        </aside>
        <div class="sidebar-resizer"></div>

        <!-- ================= MAIN CONTENT ================= -->
        <main class="main-content">

            <!-- Topbar -->
            <header class="top-nav">
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Buka Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="logbook-top-center">
                    <form action="<?php echo e(route('dashboard.logbook-dpki')); ?>" method="GET" class="search-box">
                        <input type="text" name="search" placeholder="Cari logbook..." value="<?php echo e(request('search')); ?>">
                        <button type="submit" class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </form>
                </div>
                <div class="top-user-area">
                    <div class="icon-button"><i class="fa-regular fa-message"></i></div>
                    <div class="user-badge-top">
                        <div class="user-badge-avatar">
                            <?php if(auth()->user()->profile_photo): ?>
                                <img src="/<?php echo e(auth()->user()->profile_photo); ?>" alt="Foto Profil">
                            <?php else: ?>
                                <?php echo e(substr(auth()->user()->nama_user ?? 'R', 0, 1)); ?>

                            <?php endif; ?>
                        </div>
                        <div class="user-badge-info">
                            <span class="user-badge-name"><?php echo e(auth()->user()->nama_user ?? 'root'); ?></span>
                            <span class="user-badge-role"><?php echo e(ucfirst(auth()->user()->role ?? 'user')); ?></span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Header & Actions -->
            <div class="reports-header-row">
                <div>
                    <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">Logbook DPKI</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 2px;">Kelola riwayat logbook DPKI dan aktivitas pohon</p>
                </div>
                <div class="reports-actions">
                    <?php if(in_array(auth()->user()->role, ['root', 'd_admin', 'm_admin', 'd_user'])): ?>
                    <button class="btn-primary" onclick="openCreateModal()">
                        <i class="fa-solid fa-plus"></i> Tambah Logbook
                    </button>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Flash Success -->
            <?php if(session('success')): ?>
                <div class="alert-success" style="margin-bottom: 20px; padding: 12px 20px; background-color: #d1fae5; color: #065f46; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-circle-check"></i> <?php echo e(session('success')); ?>

                </div>
            <?php endif; ?>

            <!-- Card List (Daftar Laporan Lingkungan Style) -->
            <div class="reports-summary-card" style="background: transparent; border: none; box-shadow: none; padding: 0;">
                <div class="laporan-card-header" style="background: white; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-soft);">
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--primary-color);">Daftar Log Aktivitas DPKI</h3>
                </div>

                <div class="laporan-cards-container">
                    <?php $__empty_1 = true; $__currentLoopData = $logbookList; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $logbook): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <div class="laporan-card">
                            <!-- Card Header (Always Visible) -->
                            <div class="laporan-card-header" onclick="this.parentElement.classList.toggle('expanded')">
                                <div class="laporan-card-header-left">
                                    <div class="laporan-card-images">
                                        <?php if($logbook->dokumentasi_kegiatan_sehat): ?>
                                            <a href="/<?php echo e($logbook->dokumentasi_kegiatan_sehat); ?>" target="_blank" class="laporan-card-thumb">
                                                <img src="/<?php echo e($logbook->dokumentasi_kegiatan_sehat); ?>" alt="Dokumentasi">
                                            </a>
                                        <?php elseif($logbook->dokumentasi_kegiatan): ?>
                                            <a href="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" target="_blank" class="laporan-card-thumb">
                                                <img src="/<?php echo e($logbook->dokumentasi_kegiatan); ?>" alt="Dokumentasi">
                                            </a>
                                        <?php else: ?>
                                            <div class="laporan-card-thumb-empty"><i class="fa-regular fa-image"></i></div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="laporan-card-info">
                                        <h3 class="laporan-card-title">
                                            <?php echo e($logbook->jenis_kegiatan ?? ($logbook->kegiatan_lain ? strip_tags($logbook->kegiatan_lain) : 'Aktivitas DPKI')); ?>

                                        </h3>
                                        <p class="laporan-card-desc">
                                            Pohon: <?php echo e($logbook->tree ? $logbook->tree->nama_lokal . ' (' . $logbook->tree->nama_jenis . ')' : ($logbook->nama_tumbuhan ?? '-')); ?>

                                        </p>
                                        <div class="laporan-card-meta">
                                            <span><i class="fa-regular fa-user"></i><?php echo e($logbook->user->nama_user ?? '-'); ?></span>
                                            <span><i class="fa-regular fa-calendar"></i><?php echo e(optional($logbook->create_at)->format('d M Y') ?? '-'); ?></span>
                                            <span><i class="fa-regular fa-clock"></i><?php echo e($logbook->waktu ?? '-'); ?></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="laporan-card-header-right">
                                    <div class="laporan-card-badges">
                                        <span class="badge" style="background: #ede9fe; color: #5b21b6; border: 1px solid #c084fc;"><i class="fa-solid fa-location-dot"></i> Area <?php echo e($logbook->area ?? '-'); ?></span>
                                        <?php if($logbook->kondisi_tumbuhan): ?>
                                            <span class="status-pill">
                                                <span class="status-pill-dot" style="background-color: <?php echo e($logbook->kondisi_tumbuhan == 'Sehat' ? '#10b981' : ($logbook->kondisi_tumbuhan == 'Mati' ? '#ef4444' : '#f59e0b')); ?>;"></span>
                                                Kondisi: <?php echo e($logbook->kondisi_tumbuhan); ?>

                                            </span>
                                        <?php endif; ?>
                                    </div>
                                    <i class="fa-solid fa-chevron-down laporan-card-toggle"></i>
                                </div>
                            </div>

                            <!-- Card Details (Expandable) -->
                            <div class="laporan-card-details">
                                <div class="laporan-details-grid">
                                    <div class="detail-item">
                                        <label>Vak / No Vak</label>
                                        <span style="font-weight: 600; color: var(--text-primary);"><?php echo e($logbook->vak_koleksi ?? '-'); ?> / <?php echo e($logbook->no_vak ?? '-'); ?></span>
                                    </div>

                                    <div class="detail-item">
                                        <label>Koordinat</label>
                                        <div class="laporan-koord" style="font-weight: 600; color: var(--text-primary);">
                                            <span>Lat:</span> <?php echo e($logbook->latitude ?? '-'); ?> &nbsp;·&nbsp; <span>Lng:</span> <?php echo e($logbook->longitude ?? '-'); ?>

                                        </div>
                                    </div>

                                    <?php if($logbook->kegiatan_lain): ?>
                                    <div class="detail-item detail-item-full">
                                        <label>Kegiatan Lainnya</label>
                                        <p class="laporan-full-desc" style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin: 4px 0 0;"><?php echo e($logbook->kegiatan_lain); ?></p>
                                    </div>
                                    <?php endif; ?>

                                    <?php if($logbook->kondisi_tumbuhan == 'Sakit'): ?>
                                    <div class="detail-item detail-item-full" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px;">
                                        <label style="color: #b45309; font-weight: 700;"><i class="fa-solid fa-virus"></i> Informasi Penyakit & Hama</label>
                                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.85rem; color: #78350f; margin-top: 6px;">
                                            <div><strong>Tingkat Sakit:</strong> <?php echo e($logbook->tingkat_sakit ?? '-'); ?></div>
                                            <div><strong>Kategori Sakit:</strong> <?php echo e($logbook->kategori_sakit ?? '-'); ?></div>
                                            <div><strong>Penyebab:</strong> <?php echo e($logbook->penyebab_sakit ?? '-'); ?></div>
                                            <div><strong>Penanganan:</strong> <?php echo e($logbook->penanganan_koleksi_sakit ?? '-'); ?></div>
                                        </div>
                                    </div>
                                    <?php endif; ?>
                                </div>

                                <!-- Actions -->
                                <div class="laporan-card-actions">
                                    <a href="<?php echo e(route('logbook-dpki.show', $logbook->id_logbook)); ?>" class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; text-decoration:none; color:inherit;">
                                        <i class="fa-solid fa-eye"></i> Detail Lengkap
                                    </a>
                                    <button type="button" class="btn-edit logbook-edit-btn" data-logbook='<?php echo json_encode($logbook->toArray(), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT, 512) ?>' onclick="openEditModalFromButton(this)" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: #3b82f6; color: white; border: none; cursor: pointer;">
                                        <i class="fa-solid fa-pen-to-square"></i> Update
                                    </button>
                                    <form action="<?php echo e(route('logbook-dpki.destroy', $logbook->id_logbook)); ?>" method="POST" style="display:inline-flex; margin:0;">
                                        <?php echo csrf_field(); ?>
                                        <?php echo method_field('DELETE'); ?>
                                        <button type="submit" class="btn-delete" onclick="return confirm('Yakin ingin menghapus logbook ini?');" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: #ef4444; color: white; border: none; cursor: pointer;">
                                            <i class="fa-solid fa-trash"></i> Hapus
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <div style="text-align: center; padding: 48px; color: #64748b; background: white; border-radius: 12px; border: 1px dashed var(--border-color);">
                            <i class="fa-regular fa-folder-open" style="font-size: 2rem; display: block; margin-bottom: 8px; opacity: 0.4;"></i>
                            Tidak ada data logbook ditemukan.
                        </div>
                    <?php endif; ?>
                </div>
            </div>

        </main>
    </div>

    <!-- ============================================================ -->
    <!--  MODAL: TAMBAH / UPDATE LOGBOOK                              -->
    <!-- ============================================================ -->
    <div class="modal-overlay" id="logbookModal" style="padding: 28px 0; box-sizing: border-box;">
        <div class="modal-container modal-lg">
            <div class="modal-header header-logbook">
                <h3 id="modalTitle"><i class="fa-solid fa-book"></i> Tambah Logbook Baru</h3>
                <button type="button" class="modal-close" onclick="closeLogbookModal()">&times;</button>
            </div>
            <form id="logbookForm" action="<?php echo e(route('logbook-dpki.store')); ?>" method="POST" enctype="multipart/form-data">
                <?php echo csrf_field(); ?>
                <input type="hidden" id="methodField" name="_method" value="POST">
                <div class="modal-body" style="padding: 28px 26px; overflow: auto; flex: 1 1 auto; min-height: 0;">
                    <div class="form-grid" style="gap: 18px;">

                        <!-- -->
                        <h4 class="form-section-title">
                            <i class="fa-solid fa-user-tie"></i> Identitas Petugas & Pohon
                        </h4>

                        
                        <div class="form-group">
                            <label for="id_user">Petugas / User <small style="font-weight:400; color:var(--text-secondary);">(otomatis terisi)</small></label>
                            <div style="display: flex; align-items: center; gap: 10px; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px;">
                                <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
                                    <?php echo e(strtoupper(substr(auth()->user()->nama_user ?? 'U', 0, 1))); ?>

                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);"><?php echo e(auth()->user()->nama_user); ?></div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);"><?php echo e(ucfirst(auth()->user()->role)); ?></div>
                                </div>
                            </div>
                            <input type="hidden" id="id_user" name="id_user" value="<?php echo e(auth()->user()->id_user); ?>">
                        </div>

                        <!-- Tree selection moved to koleksi_sections -->

                        <!-- -->
                        <h4 class="form-section-title">
                            <i class="fa-solid fa-clock-rotate-left"></i> Waktu & Lokasi
                        </h4>

                        <div class="form-group">
                            <label for="create_at">Tanggal Kegiatan</label>
                            <input type="datetime-local" id="create_at" name="create_at" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="waktu_jam">Waktu (Jam & Sesi)</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="time" id="waktu_jam" class="form-control" onchange="updateSesiWaktu()" style="width: 130px;" required>
                                <input type="text" id="waktu_sesi" class="form-control" readonly placeholder="Otomatis" style="background: #f1f5f9; width: 130px; border-style: dashed;">
                                <input type="hidden" id="waktu" name="waktu">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="area">Area</label>
                            <select id="area" name="area" class="form-control" onchange="toggleAreaLain()">
                                <option value="">-- Pilih Area --</option>
                                <option value="GHD (Green House Display)">GHD (Green House Display)</option>
                                <option value="Jawa Bali 1">Jawa Bali 1</option>
                                <option value="Jawa Bali 2">Jawa Bali 2</option>
                                <option value="Jawa Bali 3">Jawa Bali 3</option>
                                <option value="Kalimantan">Kalimantan</option>
                                <option value="Sumatra">Sumatra</option>
                                <option value="Sulawesi">Sulawesi</option>
                                <option value="Nusa Tenggara">Nusa Tenggara</option>
                                <option value="Maluku">Maluku</option>
                                <option value="Papua">Papua</option>
                                <option value="Tanaman Obat">Tanaman Obat</option>
                                <option value="Lokasi Lainya">Lokasi Lainya</option>
                            </select>
                            <input type="text" id="area_lain_input" name="area_text" class="form-control" style="margin-top: 10px; display: none;" placeholder="Tuliskan lokasi lainnya di sini...">
                        </div>
                        <div class="form-group">
                            <label for="vak_koleksi">Vak Koleksi</label>
                            <select id="vak_koleksi" name="vak_koleksi" class="form-control">
                                <option value="">-- Pilih Vak Koleksi --</option>
                                <option value="I.A.">I.A.</option>
                                <option value="I.B.">I.B.</option>
                                <option value="I.C.">I.C.</option>
                                <option value="I.D.">I.D.</option>
                                <option value="I.E.">I.E.</option>
                                <option value="I.F.">I.F.</option>
                                <option value="I.G.">I.G.</option>
                                <option value="I.H.">I.H.</option>
                                <option value="I.I.">I.I.</option>
                                <option value="II.A.">II.A.</option>
                                <option value="II.B.">II.B.</option>
                                <option value="II.C.">II.C.</option>
                                <option value="II.D.">II.D.</option>
                                <option value="II.E.">II.E.</option>
                                <option value="II.F.">II.F.</option>
                                <option value="II.G.">II.G.</option>
                                <option value="II.H.">II.H.</option>
                                <option value="II.I.">II.I.</option>
                                <option value="II.J.">II.J.</option>
                                <option value="II.K.">II.K.</option>
                                <option value="II.L.">II.L.</option>
                                <option value="II.M.">II.M.</option>
                                <option value="II.N.">II.N.</option>
                                <option value="III.A.">III.A.</option>
                                <option value="III.B.">III.B.</option>
                                <option value="III.C.">III.C.</option>
                                <option value="III.D.">III.D.</option>
                                <option value="IV.A.">IV.A.</option>
                                <option value="IV.B.">IV.B.</option>
                                <option value="IV.C.">IV.C.</option>
                                <option value="IV.D.">IV.D.</option>
                                <option value="IV.E.">IV.E.</option>
                                <option value="IV.F.">IV.F.</option>
                                <option value="V.A.">V.A.</option>
                                <option value="V.B.">V.B.</option>
                                <option value="V.C.">V.C.</option>
                                <option value="V.D.">V.D.</option>
                                <option value="VI.A.">VI.A.</option>
                                <option value="VI.B.">VI.B.</option>
                                <option value="VI.C.">VI.C.</option>
                                <option value="VI.D.">VI.D.</option>
                                <option value="VI.E.">VI.E.</option>
                                <option value="VI.F.">VI.F.</option>
                                <option value="VI.G.">VI.G.</option>
                                <option value="VII.A.">VII.A.</option>
                                <option value="VII.B.">VII.B.</option>
                                <option value="VII.C.">VII.C.</option>
                                <option value="VIII.A.">VIII.A.</option>
                                <option value="VIII.B.">VIII.B.</option>
                                <option value="IX.A.">IX.A.</option>
                                <option value="IX.B.">IX.B.</option>
                                <option value="X.TO.I.">X.TO.I.</option>
                                <option value="X.TO.II.">X.TO.II.</option>
                                <option value="X.TO.III.">X.TO.III.</option>
                                <option value="X.TO.IV.">X.TO.IV.</option>
                                <option value="X.TO.V.">X.TO.V.</option>
                                <option value="X.TO.VI.">X.TO.VI.</option>
                                <option value="X.TO.VII.">X.TO.VII.</option>
                                <option value="X.TO.VIII.I.">X.TO.VIII.I.</option>
                                <option value="X.TO.VIII.II.">X.TO.VIII.II.</option>
                                <option value="X.TO.VIII.III.">X.TO.VIII.III.</option>
                                <option value="X.TO.IX.">X.TO.IX.</option>
                                <option value="GHD-Kolam Bundar (Ficus)">GHD-Kolam Bundar (Ficus)</option>
                                <option value="GHD-Paludarium">GHD-Paludarium</option>
                                <option value="GHD-Klaster Kalimantan">GHD-Klaster Kalimantan</option>
                                <option value="GHD-Klaster Sumatra">GHD-Klaster Sumatra</option>
                                <option value="GHD-Klaster Sulawesi">GHD-Klaster Sulawesi</option>
                                <option value="GHD-Klaster Pegunungan Jawa">GHD-Klaster Pegunungan Jawa</option>
                                <option value="GHD-Klaster Papua">GHD-Klaster Papua</option>
                                <option value="Area Kantor">Area Kantor</option>
                            </select>
                        </div>
                        <div class="form-group form-full">
                            <label for="no_vak">No. Vak</label>
                            <p style="margin-top: 0; margin-bottom: 10px; color: var(--text-secondary); font-size: 0.9rem;">Isi nomor spesimen, contoh: 1, 1a</p>
                            <input type="text" id="no_vak" name="no_vak" class="form-control" placeholder='Contoh: 1, 1a'>
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; font-size: 0.9rem; cursor: pointer; margin-top: 8px; color: var(--text-secondary);">
                                <input type="checkbox" id="is_bukan_koleksi" onchange="toggleBukanKoleksi()"> Bukan koleksi
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="latitude">Latitude</label>
                            <input type="number" step="any" id="latitude" name="latitude" class="form-control" placeholder="Contoh: -6.40234">
                        </div>
                        <div class="form-group">
                            <label for="longitude">Longitude</label>
                            <input type="number" step="any" id="longitude" name="longitude" class="form-control" placeholder="Contoh: 106.85234">
                        </div>
                        <div class="form-group form-full" style="margin-bottom: 8px;">
                            <button type="button" class="btn-secondary" onclick="deteksiLokasiTree()" style="display: flex; align-items: center; gap: 8px; justify-content: center; width: fit-content; padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 8px;">
                                <i class="fa-solid fa-location-crosshairs" style="color: var(--accent-color);"></i> Deteksi Lokasi Saat Ini
                            </button>
                            <div id="tree_lokasi_status" style="margin-top: 8px; font-size: 0.82rem; display: none; padding: 8px 12px; border-radius: 6px; line-height: 1.4;"></div>
                        </div>
                        <div class="form-group form-full">
                            <label for="jenis_kegiatan">Jenis Kegiatan *</label>
                            <select id="jenis_kegiatan" name="jenis_kegiatan" required class="form-control" onchange="toggleKegiatanLain()">
                                <option value="">-- Pilih Jenis Kegiatan --</option>
                                <option value="Kegiatan Pemeliharaan Koleksi atau Non-Koleksi">Kegiatan Pemeliharaan Koleksi atau Non-Koleksi</option>
                                <option value="Kegiatan Lainnya">Kegiatan Lainnya</option>
                            </select>
                        </div>

                        <!-- Checkboxes for Kegiatan Lainnya (Hidden by default) -->
                        <div class="form-group form-full" id="kegiatan_lainnya_container" style="display: none; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-top: -10px;">
                            <label style="margin-bottom: 12px; display: block; color: var(--primary-color);">Pilih Kegiatan Lainnya:</label>
                            <div class="option-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Kebersihan lingkungan"> Kebersihan lingkungan
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Membuat laporan"> Membuat laporan
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Mengikuti kegiatan pelatihan"> Mengikuti kegiatan pelatihan
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Mendampingi penelitian"> Mendampingi penelitian
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Mengikuti kegiatan monev"> Mengikuti kegiatan monev
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Mengikuti rapat"> Mengikuti rapat
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Mengisi SKP"> Mengisi SKP
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Tugas Dinas"> Tugas Dinas
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Ijin pada jam kerja"> Ijin pada jam kerja
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="WFA"> WFA
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Sakit"> Sakit
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="kegiatan_lain[]" value="Cuti"> Cuti
                                </label>
                                <label class="option-item" style="grid-column: 1 / -1;">
                                    <input type="checkbox" id="kegiatan_lain_yang_lain" name="kegiatan_lain[]" value="Yang lain" onchange="toggleYangLainInput()"> Yang lain:
                                </label>
                            </div>
                            <input type="text" id="kegiatan_lain_input" name="kegiatan_lain_text" class="form-control" style="margin-top: 10px; display: none;" placeholder="Tuliskan kegiatan lain di sini...">
                        </div>

                        <!-- Wrapper for Koleksi Sections (Hidden when Kegiatan Lainnya is selected) -->
                        <div id="koleksi_sections" class="form-full" style="display: none;">
                            
                            <!-- Koleksi Pohon -->
                            <h4 class="form-section-title">
                                <i class="fa-solid fa-tree"></i> Tumbuhan / Koleksi Pohon
                            </h4>
                            <div class="form-group form-full" id="tree_selection_group">
                                <label for="tree_search">Nama Tumbuhan (Koleksi) *</label>
                                <div class="tree-select-wrapper" id="treeSelectWrapper">
                                    <div class="tree-selected-display" id="treeSelectedDisplay" onclick="toggleTreeDropdown()">
                                        <span id="treeSelectedText">-- Pilih Pohon --</span>
                                        <i class="fa-solid fa-chevron-down" style="font-size:0.75rem; color:var(--text-secondary);"></i>
                                    </div>
                                    <div class="tree-dropdown-list" id="treeDropdownList">
                                        <input type="text" class="tree-search-input" id="tree_search" placeholder="Cari nama pohon..." oninput="filterTrees(this.value)" onclick="event.stopPropagation()">
                                        <div id="treeOptionsList">
                                            <?php $__currentLoopData = $treeList; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $tree): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                <div class="tree-option" data-id="<?php echo e($tree->id_tree); ?>" data-label="<?php echo e($tree->nama_lokal); ?> - <?php echo e($tree->nama_jenis); ?>" onclick="selectTree(<?php echo e($tree->id_tree); ?>, '<?php echo e(addslashes($tree->nama_lokal)); ?>', '<?php echo e(addslashes($tree->nama_jenis)); ?>', '<?php echo e(addslashes($tree->genus)); ?>')">
                                                    <strong><?php echo e($tree->nama_lokal); ?></strong>
                                                    <em> - <?php echo e($tree->nama_jenis); ?></em>
                                                    <?php if($tree->no_baru): ?> <small style="color:#94a3b8; margin-left:6px;">#<?php echo e($tree->no_baru); ?></small> <?php endif; ?>
                                                </div>
                                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                        </div>
                                    </div>
                                    <input type="hidden" id="id_tree" name="id_tree">
                                </div>
                            </div>
                            
                            <div class="form-group form-full">
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; color: var(--accent-color);">
                                    <input type="checkbox" id="is_manual_plant" onchange="toggleManualPlant()"> Tanaman tidak ada di daftar? Ketik manual
                                </label>
                            </div>

                            <div class="form-group form-full" id="manual_nama_tumbuhan_group" style="display: none;">
                                <label for="nama_tumbuhan">Nama Tumbuhan (Manual) *</label>
                                <input type="text" id="nama_tumbuhan" name="nama_tumbuhan" class="form-control" placeholder="Masukkan nama tumbuhan">
                            </div>
                            
                            <div class="form-group form-full" id="genus_group">
                                <label for="nama_genus">Nama Genus</label>
                                <input type="text" id="nama_genus" name="nama_genus" class="form-control" placeholder="Otomatis terisi dari pohon yang dipilih..." readonly>
                            </div>
                            <!-- -->
                            <h4 class="form-section-title">
                                <i class="fa-solid fa-tag"></i> Kondisi Label & Tumbuhan
                            </h4>

                        <div class="form-group form-full">
                            <label>Kondisi Label Mekolin</label>
                            <div class="option-group">
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_mekolin" value="Masih bagus" onchange="toggleMekolinLain()"> Masih bagus
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_mekolin" value="Rusak/lepas" onchange="toggleMekolinLain()"> Rusak/lepas
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_mekolin" value="Tulisan tidak jelas" onchange="toggleMekolinLain()"> Tulisan tidak jelas
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_mekolin" value="Tidak berlabel" onchange="toggleMekolinLain()"> Tidak berlabel
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_mekolin" id="mekolin_yang_lain" value="Yang lain" onchange="toggleMekolinLain()"> Yang lain:
                                    <input type="text" id="mekolin_lain_input" name="kondisi_label_mekolin_text" class="lain-input" style="display: none;" placeholder="Sebutkan kondisinya">
                                </label>
                            </div>
                        </div>
                        <div class="form-group form-full">
                            <label>Kondisi Label Seng</label>
                            <div class="option-group">
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_seng" value="Masih bagus" onchange="toggleSengLain()"> Masih bagus
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_seng" value="Rusak/lepas" onchange="toggleSengLain()"> Rusak/lepas
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_seng" value="Nomor seng salah" onchange="toggleSengLain()"> Nomor seng salah
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_seng" value="Tidak berlabel seng" onchange="toggleSengLain()"> Tidak berlabel seng
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_label_seng" id="seng_yang_lain" value="Yang lain" onchange="toggleSengLain()"> Yang lain:
                                    <input type="text" id="seng_lain_input" name="kondisi_label_seng_text" class="lain-input" style="display: none;" placeholder="Sebutkan kondisinya">
                                </label>
                            </div>
                        </div>
                        <div class="form-group form-full">
                            <label>Pemeliharaan label mekolin/seng *</label>
                            <div class="option-group">
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" value="Membersihkan label" onchange="togglePemeliharaanLain()"> Membersihkan label
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" value="Mengganti label mekolin" onchange="togglePemeliharaanLain()"> Mengganti label mekolin
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" value="Menulis ulang identitas label mekolin" onchange="togglePemeliharaanLain()"> Menulis ulang identitas label mekolin
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" value="Mengganti label seng" onchange="togglePemeliharaanLain()"> Mengganti label seng
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" value="Tidak ada" onchange="togglePemeliharaanLain()"> Tidak ada
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" name="pemeliharaan_label[]" id="pemeliharaan_yang_lain" value="Yang lain" onchange="togglePemeliharaanLain()"> Yang lain:
                                    <input type="text" id="pemeliharaan_lain_input" name="pemeliharaan_label_text" class="lain-input" style="display: none;" placeholder="Sebutkan">
                                </label>
                            </div>
                        </div>
                        <div class="form-group form-full">
                            <label>Kondisi tumbuhan *</label>
                            <p style="margin-top: 0; margin-bottom: 10px; color: var(--text-secondary); font-size: 0.9rem;">Isi dengan kondisi tumbuhan hasil pemeriksaan visual.</p>
                            <div class="option-group">
                                <label class="option-item">
                                    <input type="radio" name="kondisi_tumbuhan" value="Sehat" onchange="toggleKondisiTumbuhan()" onclick="toggleKondisiTumbuhan()"> Sehat
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_tumbuhan" value="Sakit/Merana" onchange="toggleKondisiTumbuhan()" onclick="toggleKondisiTumbuhan()"> Sakit/Merana
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_tumbuhan" value="Rawan" onchange="toggleKondisiTumbuhan()" onclick="toggleKondisiTumbuhan()"> Rawan
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="kondisi_tumbuhan" value="Mati" onchange="toggleKondisiTumbuhan()" onclick="toggleKondisiTumbuhan()"> Mati
                                </label>
                            </div>
                        </div>

                        <!-- -->
                        <div id="section_tumbuhan_sehat" class="form-full" style="display: none; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; background-color: #f8fafc;">
                            <h4 class="form-section-title" style="margin-top: 0;">
                                <i class="fa-solid fa-leaf"></i> Tumbuhan Sehat
                            </h4>

                            <div class="form-group form-full">
                                <label>Pemeliharaan Rutin *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Membersihkan gulma di area perakaran (bobokor)" onchange="togglePemeliharaanRutinLain()"> Membersihkan gulma di area perakaran (bobokor)
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Membersihkan batang/dahan dari epifit/parasit" onchange="togglePemeliharaanRutinLain()"> Membersihkan batang/dahan dari epifit/parasit
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Pemangkasan dahan/cabang" onchange="togglePemeliharaanRutinLain()"> Pemangkasan dahan/cabang
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Penyiraman koleksi baru" onchange="togglePemeliharaanRutinLain()"> Penyiraman koleksi baru
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Pemupukan koleksi baru" onchange="togglePemeliharaanRutinLain()"> Pemupukan koleksi baru
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Penyiraman tanaman hias/border" onchange="togglePemeliharaanRutinLain()"> Penyiraman tanaman hias/border
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Tidak ada" onchange="togglePemeliharaanRutinLain()"> Tidak ada
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" id="pemeliharaan_rutin_yang_lain" value="Yang lain" onchange="togglePemeliharaanRutinLain()"> Yang lain:
                                        <input type="text" id="pemeliharaan_rutin_lain_input" name="pemeliharaan_rutin_text" class="lain-input" style="display: none;" placeholder="Sebutkan">
                                    </label>
                                </div>
                            </div>
                            <div class="form-group form-full">
                                <label for="dokumentasi_kegiatan_sehat">Dokumentasi Kegiatan (Sehat)</label>
                                <input type="file" id="dokumentasi_kegiatan_sehat" name="dokumentasi_kegiatan_sehat" class="form-control" accept="image/*" capture="environment">
                                <div id="preview_sehat" style="margin-top: 10px; display: none;">
                                    <img id="img_preview_sehat" src="" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border-color);">
                                </div>
                            </div>
                        </div>

                        <!-- -->
                        <div id="section_tumbuhan_sakit" class="form-full" style="display: none; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; background-color: #fff1f2;">
                            <h4 class="form-section-title" style="margin-top: 0; color: #e11d48; border-bottom-color: #fecdd3;">
                                <i class="fa-solid fa-virus"></i> Tumbuhan Sakit / Merana
                            </h4>

                            <div class="form-group form-full">
                                <label>Tingkat Sakit *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="radio" name="tingkat_sakit" value="Sakit ringan" onchange="toggleTingkatSakitLain()"> Sakit ringan
                                    </label>
                                    <label class="option-item">
                                        <input type="radio" name="tingkat_sakit" value="Sakit sedang" onchange="toggleTingkatSakitLain()"> Sakit sedang
                                    </label>
                                    <label class="option-item">
                                        <input type="radio" name="tingkat_sakit" value="Sakit berat" onchange="toggleTingkatSakitLain()"> Sakit berat
                                    </label>
                                    <label class="option-item">
                                        <input type="radio" name="tingkat_sakit" id="tingkat_sakit_yang_lain" value="Yang lain" onchange="toggleTingkatSakitLain()"> Yang lain:
                                        <input type="text" id="tingkat_sakit_lain_input" name="tingkat_sakit_text" class="lain-input" style="display: none;" placeholder="Sebutkan tingkat sakitnya">
                                    </label>
                                </div>
                            </div>
                                <div class="form-group form-full">
                                <label>Kategori Sakit *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_sakit[]" value="Akar sakit" onchange="toggleKategoriSakitLain()"> Akar sakit
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_sakit[]" value="Batang sakit" onchange="toggleKategoriSakitLain()"> Batang sakit
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_sakit[]" value="Daun sakit" onchange="toggleKategoriSakitLain()"> Daun sakit
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_sakit[]" value="Pertumbuhan tidak normal (kerdil, tajuk jarang, dll)" onchange="toggleKategoriSakitLain()"> Pertumbuhan tidak normal (kerdil, tajuk jarang, dll)
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_sakit[]" id="kategori_sakit_yang_lain" value="Yang lain" onchange="toggleKategoriSakitLain()"> Yang lain:
                                        <input type="text" id="kategori_sakit_lain_input" name="kategori_sakit_text" class="lain-input" style="display: none;" placeholder="Sebutkan kategorinya">
                                    </label>
                                </div>
                            </div>
                                <div class="form-group form-full">
                                <label>Penyebab Sakit *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" value="Jamur" onchange="togglePenyebabSakitLain()"> Jamur
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" value="Rayap" onchange="togglePenyebabSakitLain()"> Rayap
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" value="Ulat" onchange="togglePenyebabSakitLain()"> Ulat
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" value="Uret" onchange="togglePenyebabSakitLain()"> Uret
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" value="Penggerek" onchange="togglePenyebabSakitLain()"> Penggerek
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penyebab_sakit[]" id="penyebab_sakit_yang_lain" value="Hama/penyakit lain" onchange="togglePenyebabSakitLain()"> Hama/penyakit lain:
                                        <input type="text" id="penyebab_sakit_lain_input" name="penyebab_sakit_text" class="lain-input" style="display: none;" placeholder="Sebutkan penyebabnya">
                                    </label>
                                </div>
                            </div>
                                <div class="form-group form-full">
                                <label>Penanganan koleksi sakit/merana *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pengendalian HPT" onchange="togglePenangananSakitLain()"> Pengendalian HPT
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pemberian salep kambium" onchange="togglePenangananSakitLain()"> Pemberian salep kambium
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pemupukan" onchange="togglePenangananSakitLain()"> Pemupukan
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Penyiraman" onchange="togglePenangananSakitLain()"> Penyiraman
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Tidak ada" onchange="togglePenangananSakitLain()"> Tidak ada
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" id="penanganan_sakit_yang_lain" value="Yang lain" onchange="togglePenangananSakitLain()"> Yang lain:
                                        <input type="text" id="penanganan_sakit_lain_input" name="penanganan_koleksi_sakit_text" class="lain-input" style="display: none;" placeholder="Sebutkan penanganannya">
                                    </label>
                            </div>
                        </div>
                        </div>

                        <!-- -->
                        <div id="section_tumbuhan_rawan" class="form-full" style="display: none; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; background-color: #fffbeb;">
                            <h4 class="form-section-title" style="margin-top: 0; color: #d97706; border-bottom-color: #fde68a;">
                                <i class="fa-solid fa-triangle-exclamation"></i> Kondisi Koleksi Rawan
                            </h4>

                            <div class="form-group form-full">
                                <label>Kategori rawan *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_rawan[]" value="Rawan patah" onchange="toggleKategoriRawanLain()"> Rawan patah
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_rawan[]" value="Rawan tumbang" onchange="toggleKategoriRawanLain()"> Rawan tumbang
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="kategori_rawan[]" id="kategori_rawan_yang_lain" value="Yang lain" onchange="toggleKategoriRawanLain()"> Yang lain:
                                        <input type="text" id="kategori_rawan_lain_input" name="kategori_rawan_text" class="lain-input" style="display: none;" placeholder="Sebutkan kategori rawan">
                                    </label>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label>Penanganan koleksi sakit/merana *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pengendalian HPT" onchange="togglePenangananSakitRawanLain()"> Pengendalian HPT
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pemberian salep kambium" onchange="togglePenangananSakitRawanLain()"> Pemberian salep kambium
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Pemupukan" onchange="togglePenangananSakitRawanLain()"> Pemupukan
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Penyiraman" onchange="togglePenangananSakitRawanLain()"> Penyiraman
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" value="Tidak ada" onchange="togglePenangananSakitRawanLain()"> Tidak ada
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_koleksi_sakit[]" id="penanganan_sakit_rawan_yang_lain" value="Yang lain" onchange="togglePenangananSakitRawanLain()"> Yang lain:
                                        <input type="text" id="penanganan_sakit_rawan_lain_input" name="penanganan_koleksi_sakit_text" class="lain-input" style="display: none;" placeholder="Sebutkan penanganannya">
                                    </label>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label>Penanganan tumbuhan rawan *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Penegakkan/mendirikan koleksi tumbang" onchange="togglePenangananRawanLain()"> Penegakkan/mendirikan koleksi tumbang
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Pemangkasan batang/dahan/cabang rawan" onchange="togglePenangananRawanLain()"> Pemangkasan batang/dahan/cabang rawan
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Penebangan tumbuhan rawan" onchange="togglePenangananRawanLain()"> Penebangan tumbuhan rawan
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Pemangkasan/penebangan seboom" onchange="togglePenangananRawanLain()"> Pemangkasan/penebangan seboom
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Pemasangan sling atau penyangga" onchange="togglePenangananRawanLain()"> Pemasangan sling atau penyangga
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Pemasangan tanda peringatan/bahaya" onchange="togglePenangananRawanLain()"> Pemasangan tanda peringatan/bahaya
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Pemasangan pembatas area (police line)" onchange="togglePenangananRawanLain()"> Pemasangan pembatas area (police line)
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" value="Tidak ada" onchange="togglePenangananRawanLain()"> Tidak ada
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="penanganan_tumbuhan_rawan[]" id="penanganan_rawan_yang_lain" value="Yang lain" onchange="togglePenangananRawanLain()"> Yang lain:
                                        <input type="text" id="penanganan_rawan_lain_input" name="penanganan_tumbuhan_rawan_text" class="lain-input" style="display: none;" placeholder="Sebutkan penanganan rawan">
                                    </label>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label>Pemeliharaan Rutin *</label>
                                <div class="option-group">
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Membersihkan gulma di area perakaran (bobokor)" onchange="togglePemeliharaanRutinRawanLain()"> Membersihkan gulma di area perakaran (bobokor)
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Membersihkan batang/dahan dari epifit/parasit" onchange="togglePemeliharaanRutinRawanLain()"> Membersihkan batang/dahan dari epifit/parasit
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Pemangkasan dahan/cabang" onchange="togglePemeliharaanRutinRawanLain()"> Pemangkasan dahan/cabang
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Penyiraman koleksi baru" onchange="togglePemeliharaanRutinRawanLain()"> Penyiraman koleksi baru
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Pemupukan koleksi baru" onchange="togglePemeliharaanRutinRawanLain()"> Pemupukan koleksi baru
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Penyiraman tanaman hias/border" onchange="togglePemeliharaanRutinRawanLain()"> Penyiraman tanaman hias/border
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" value="Tidak ada" onchange="togglePemeliharaanRutinRawanLain()"> Tidak ada
                                    </label>
                                    <label class="option-item">
                                        <input type="checkbox" name="pemeliharaan_rutin[]" id="pemeliharaan_rutin_rawan_yang_lain" value="Yang lain" onchange="togglePemeliharaanRutinRawanLain()"> Yang lain:
                                        <input type="text" id="pemeliharaan_rutin_rawan_lain_input" name="pemeliharaan_rutin_text" class="lain-input" style="display: none;" placeholder="Sebutkan">
                                    </label>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label for="dokumentasi_kegiatan_rawan">Dokumentasi kegiatan, cukup 1 foto</label>
                                <p style="margin-top: 0; margin-bottom: 10px; color: var(--text-secondary); font-size: 0.9rem;">Upload 1 file yang didukung image. Maks 10 MB.</p>
                                <input type="file" id="dokumentasi_kegiatan_rawan" name="dokumentasi_kegiatan" class="form-control" accept="image/*" capture="environment">
                                <div id="preview_rawan" style="margin-top: 10px; display: none;">
                                    <img id="img_preview_rawan" src="" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border-color);">
                                </div>
                            </div>
                        </div>

                        <!-- -->
                        <div id="section_tumbuhan_mati" class="form-full" style="display: none; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; background-color: #f1f5f9;">
                            <h4 class="form-section-title" style="margin-top: 0; color: #475569; border-bottom-color: #cbd5e1;">
                                <i class="fa-solid fa-skull-crossbones"></i> Tumbuhan Mati
                            </h4>

                            <div class="form-group form-full">
                                <label for="kondisi_koleksi_mati">Kondisi Koleksi Mati</label>
                                <input type="text" id="kondisi_koleksi_mati" name="kondisi_koleksi_mati" class="form-control" placeholder="Mati Total / Sebagian">
                            </div>
                            <div class="form-group form-full">
                                <label for="dokumentasi_kegiatan">Dokumentasi Kegiatan (Mati)</label>
                                <input type="file" id="dokumentasi_kegiatan" name="dokumentasi_kegiatan" class="form-control" accept="image/*" capture="environment">
                                <div id="preview_mati" style="margin-top: 10px; display: none;">
                                    <img id="img_preview_mati" src="" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border-color);">
                                </div>
                            </div>

                        <!-- Catatan Lain moved to checkboxes, removing old textarea -->

                        </div> <!-- End koleksi_sections -->

                        <!-- Dokumentasi untuk Kegiatan Lainnya -->
                        <div id="dokumentasi_lainnya_section" style="display: none;">
                            <h4 class="form-section-title">
                                <i class="fa-solid fa-image"></i> Dokumentasi Kegiatan
                            </h4>
                            <div class="form-group form-full">
                                <label for="dokumentasi_kegiatan_lain">Upload / Ambil Foto</label>
                                <input type="file" id="dokumentasi_kegiatan_lain" name="dokumentasi_kegiatan_lain" class="form-control" accept="image/*" capture="environment">
                                <div id="preview_lain" style="margin-top: 10px; display: none;">
                                    <img id="img_preview_lain" src="" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border-color);">
                                </div>
                                </div>
                            </div>
                        </div>
                   </div>
                   <div class="modal-footer" style="justify-content: flex-end; gap: 14px; padding: 20px 28px;">
                       <button type="button" class="btn-secondary" onclick="closeLogbookModal()" style="min-width: 120px;">Batal</button>
                       <button type="submit" class="btn-primary" style="min-width: 140px;"><i class="fa-solid fa-paper-plane"></i> Kirim Logbook</button>
                   </div>
               </form>
        </div>
    </div>

    <!-- ============================================================ -->
    <!--  MODAL: DETAIL LOGBOOK LENGKAP                              -->
    <!-- ============================================================ -->
    <div class="modal-overlay" id="detailModalLogbook">
        <div class="modal-container modal-lg">
            <div class="modal-header header-logbook">
                <h3><i class="fa-solid fa-circle-info"></i> Detail Logbook DPKI</h3>
                <button type="button" class="modal-close" onclick="closeDetailModalLogbook()">&times;</button>
            </div>
            <div class="modal-body" id="detailContentLogbook" style="max-height: 75vh; overflow: auto; flex: 1 1 auto; padding: 24px;">
                <!-- Dinamis diisi lewat JS -->
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeDetailModalLogbook()" class="btn-primary">Tutup</button>
            </div>
        </div>
    </div>

    <script>
        const TREE_DATA = <?php echo json_encode($treeData, 15, 512) ?>;
        // Deteksi lokasi untuk logbook
        function deteksiLokasiTree() {
            const latEl = document.getElementById('latitude');
            const lngEl = document.getElementById('longitude');
            const statusEl = document.getElementById('tree_lokasi_status');
            if (!statusEl) return;
            statusEl.style.display = 'block';
            statusEl.style.background = '#eff6ff';
            statusEl.style.border = '1px solid #bfdbfe';
            statusEl.style.color = '#1e40af';
            statusEl.innerHTML = '<i class="fa-solid fa-location-crosshairs fa-spin"></i> Meminta izin & mendeteksi lokasi...';
            if (!navigator.geolocation) {
                statusEl.style.background = '#fff7ed';
                statusEl.style.border = '1px solid #fed7aa';
                statusEl.style.color = '#9a3412';
                statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Browser tidak mendukung Geolocation.';
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    var lat = pos.coords.latitude.toFixed(8);
                    var lng = pos.coords.longitude.toFixed(8);
                    var acc = Math.round(pos.coords.accuracy);
                    if (latEl) latEl.value = lat;
                    if (lngEl) lngEl.value = lng;
                    statusEl.style.background = '#ecfdf5';
                    statusEl.style.border = '1px solid #6ee7b7';
                    statusEl.style.color = '#065f46';
                    statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Lokasi terdeteksi! Akurasi ±' + acc + 'm (' + lat + ', ' + lng + ')';
                },
                function(err) {
                    statusEl.style.background = '#fff7ed';
                    statusEl.style.border = '1px solid #fed7aa';
                    statusEl.style.color = '#9a3412';
                    if (err.code === err.PERMISSION_DENIED) {
                        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Izin lokasi ditolak. Aktifkan lokasi di browser lalu coba lagi.';
                    } else {
                        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Gagal mendeteksi lokasi. Coba lagi.';
                    }
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        }

        function toggleTreeDropdown() {
            const list = document.getElementById('treeDropdownList');
            const isOpen = list.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                list.classList.add('open');
                document.getElementById('tree_search').value = '';
                filterTrees('');
                setTimeout(() => document.getElementById('tree_search').focus(), 50);
            }
        }

        function closeAllDropdowns() {
            document.querySelectorAll('.tree-dropdown-list').forEach(d => d.classList.remove('open'));
        }

        function filterTrees(query) {
            const q = query.toLowerCase();
            const list = document.getElementById('treeOptionsList');
            let html = '';
            const currentId = document.getElementById('id_tree').value;
            TREE_DATA.forEach(t => {
                const label = (t.nama_lokal + ' ' + t.nama_jenis).toLowerCase();
                if (!q || label.includes(q)) {
                    const isSelected = String(t.id) === String(currentId) ? ' selected' : '';
                    const badge = t.no_baru ? `<small style="color:#94a3b8; margin-left:6px;">#${t.no_baru}</small>` : '';
                    html += `<div class="tree-option${isSelected}" data-id="${t.id}" onclick="selectTree(${t.id}, '${(t.nama_lokal||'').replace(/'/g,"\\'")}', '${(t.nama_jenis||'').replace(/'/g,"\\'")}', '${(t.genus||'').replace(/'/g,"\\'")}')">
                        <strong>${t.nama_lokal}</strong><em> - ${t.nama_jenis}</em>${badge}
                    </div>`;
                }
            });
            list.innerHTML = html || '<div style="padding:12px 14px; color:var(--text-secondary); font-size:0.85rem;">Tidak ada pohon ditemukan.</div>';
        }

        function selectTree(id, namaLokal, namaJenis, genus) {
            document.getElementById('id_tree').value = id;
            const display = document.getElementById('treeSelectedDisplay');
            display.classList.add('has-value');
            document.getElementById('treeSelectedText').innerHTML = `<strong>${namaLokal}</strong>${namaJenis ? ` <em style="color:var(--text-secondary); font-size:0.8rem;">- ${namaJenis}</em>` : ``}`;
            
            // Set genus automatically
            document.getElementById('nama_genus').value = genus || '';
            
            closeAllDropdowns();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#treeSelectWrapper')) {
                closeAllDropdowns();
            }
        });

        function toggleKegiatanLain() {
            const select = document.getElementById('jenis_kegiatan');
            const container = document.getElementById('kegiatan_lainnya_container');
            const koleksiSections = document.getElementById('koleksi_sections');
            const dokLainSection = document.getElementById('dokumentasi_lainnya_section');
            
            if (select.value === 'Kegiatan Lainnya') {
                container.style.display = 'block';
                koleksiSections.style.display = 'none';
                dokLainSection.style.display = 'block';
            } else if (select.value === 'Kegiatan Pemeliharaan Koleksi atau Non-Koleksi') {
                container.style.display = 'none';
                koleksiSections.style.display = 'block';
                dokLainSection.style.display = 'none';
            } else {
                container.style.display = 'none';
                koleksiSections.style.display = 'none';
                dokLainSection.style.display = 'none';
            }
        }

        function toggleMekolinLain() {
            const radio = document.getElementById('mekolin_yang_lain');
            const input = document.getElementById('mekolin_lain_input');
            if (radio.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function toggleSengLain() {
            const radio = document.getElementById('seng_yang_lain');
            const input = document.getElementById('seng_lain_input');
            if (radio.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePemeliharaanLain() {
            const checkbox = document.getElementById('pemeliharaan_yang_lain');
            const input = document.getElementById('pemeliharaan_lain_input');
            if (checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePemeliharaanRutinLain() {
            const checkbox = document.getElementById('pemeliharaan_rutin_yang_lain');
            const input = document.getElementById('pemeliharaan_rutin_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function toggleTingkatSakitLain() {
            const radio = document.getElementById('tingkat_sakit_yang_lain');
            const input = document.getElementById('tingkat_sakit_lain_input');
            if (radio && radio.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function toggleKategoriSakitLain() {
            const checkbox = document.getElementById('kategori_sakit_yang_lain');
            const input = document.getElementById('kategori_sakit_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePenyebabSakitLain() {
            const checkbox = document.getElementById('penyebab_sakit_yang_lain');
            const input = document.getElementById('penyebab_sakit_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePenangananSakitLain() {
            const checkbox = document.getElementById('penanganan_sakit_yang_lain');
            const input = document.getElementById('penanganan_sakit_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePenangananRawanLain() {
            const checkbox = document.getElementById('penanganan_rawan_yang_lain');
            const input = document.getElementById('penanganan_rawan_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function toggleKategoriRawanLain() {
            const checkbox = document.getElementById('kategori_rawan_yang_lain');
            const input = document.getElementById('kategori_rawan_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePenangananSakitRawanLain() {
            const checkbox = document.getElementById('penanganan_sakit_rawan_yang_lain');
            const input = document.getElementById('penanganan_sakit_rawan_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function togglePemeliharaanRutinRawanLain() {
            const checkbox = document.getElementById('pemeliharaan_rutin_rawan_yang_lain');
            const input = document.getElementById('pemeliharaan_rutin_rawan_lain_input');
            if (checkbox && checkbox.checked) {
                input.style.display = 'inline-block';
                input.required = true;
            } else if (input) {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function setSectionInputsEnabled(sectionEl, enabled) {
            if (!sectionEl) return;
            sectionEl.querySelectorAll('input, select, textarea, button').forEach(el => {
                el.disabled = !enabled;
            });
        }

        function toggleYangLainInput() {
            const checkbox = document.getElementById('kegiatan_lain_yang_lain');
            const input = document.getElementById('kegiatan_lain_input');
            if (checkbox.checked) {
                input.style.display = 'block';
            } else {
                input.style.display = 'none';
                input.value = '';
            }
        }

        function toggleAreaLain() {
            const select = document.getElementById('area');
            const input = document.getElementById('area_lain_input');
            if (select.value === 'Lokasi Lainya') {
                input.style.display = 'inline-block';
                input.required = true;
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }

        function toggleBukanKoleksi() {
            const checkbox = document.getElementById('is_bukan_koleksi');
            const input = document.getElementById('no_vak');
            if (checkbox.checked) {
                input.value = '-';
                input.readOnly = true;
                input.style.backgroundColor = '#f1f5f9';
            } else {
                if (input.value === '-') input.value = '';
                input.readOnly = false;
                input.style.backgroundColor = '';
            }
        }

        function updateSesiWaktu() {
            const jamVal = document.getElementById('waktu_jam').value;
            const sesiInput = document.getElementById('waktu_sesi');
            const hiddenInput = document.getElementById('waktu');
            
            if (!jamVal) {
                sesiInput.value = '';
                hiddenInput.value = '';
                return;
            }
            
            const jam = parseInt(jamVal.split(':')[0], 10);
            let sesi = '';
            
            if (jam >= 4 && jam < 11) sesi = 'Pagi';
            else if (jam >= 11 && jam < 15) sesi = 'Siang';
            else if (jam >= 15 && jam < 18) sesi = 'Sore';
            else sesi = 'Malam';
            
            sesiInput.value = sesi;
            hiddenInput.value = `${sesi} / ${jamVal}`;
        }

        function toggleKondisiTumbuhan() {
            const sehat = document.getElementById('section_tumbuhan_sehat');
            const sakit = document.getElementById('section_tumbuhan_sakit');
            const rawan = document.getElementById('section_tumbuhan_rawan');
            const mati = document.getElementById('section_tumbuhan_mati');
            
            sehat.style.display = 'none';
            sakit.style.display = 'none';
            rawan.style.display = 'none';
            mati.style.display = 'none';

            setSectionInputsEnabled(sehat, false);
            setSectionInputsEnabled(sakit, false);
            setSectionInputsEnabled(rawan, false);
            setSectionInputsEnabled(mati, false);
            
            const selected = document.querySelector('input[name="kondisi_tumbuhan"]:checked');
            if (selected) {
                if (selected.value === 'Sehat') {
                    sehat.style.display = 'block';
                    setSectionInputsEnabled(sehat, true);
                } else if (selected.value === 'Sakit/Merana') {
                    sakit.style.display = 'block';
                    setSectionInputsEnabled(sakit, true);
                } else if (selected.value === 'Rawan') {
                    rawan.style.display = 'block';
                    setSectionInputsEnabled(rawan, true);
                } else if (selected.value === 'Mati') {
                    mati.style.display = 'block';
                    setSectionInputsEnabled(mati, true);
                }
            }
        }

        function toggleManualPlant() {
            const isManual = document.getElementById('is_manual_plant').checked;
            const treeGroup = document.getElementById('tree_selection_group');
            const manualGroup = document.getElementById('manual_nama_tumbuhan_group');
            const inputTumbuhan = document.getElementById('nama_tumbuhan');
            const inputGenus = document.getElementById('nama_genus');
            
            if (isManual) {
                treeGroup.style.display = 'none';
                manualGroup.style.display = 'block';
                inputTumbuhan.required = true;
                
                // For manual plant, they can type genus manually
                inputGenus.readOnly = false;
                inputGenus.placeholder = "Masukkan nama genus";
                
                // Clear existing selection
                document.getElementById('id_tree').value = '';
                document.getElementById('treeSelectedText').textContent = '-- Pilih Pohon --';
                document.getElementById('treeSelectedDisplay').classList.remove('has-value');
                inputGenus.value = '';
                
            } else {
                treeGroup.style.display = 'block';
                manualGroup.style.display = 'none';
                inputTumbuhan.required = false;
                inputTumbuhan.value = '';
                
                // Genus is readonly when picking from DB
                inputGenus.readOnly = true;
                inputGenus.placeholder = "Otomatis terisi dari pohon yang dipilih...";
                inputGenus.value = '';
            }
        }

        // Image Preview logic
        document.getElementById('dokumentasi_kegiatan_sehat').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('preview_sehat');
            const img = document.getElementById('img_preview_sehat');
            if (file) {
                img.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        document.getElementById('dokumentasi_kegiatan').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('preview_mati');
            const img = document.getElementById('img_preview_mati');
            if (file) {
                img.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        document.getElementById('dokumentasi_kegiatan_rawan').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('preview_rawan');
            const img = document.getElementById('img_preview_rawan');
            if (file) {
                img.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        document.getElementById('dokumentasi_kegiatan_lain').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('preview_lain');
            const img = document.getElementById('img_preview_lain');
            if (file) {
                img.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        function openCreateModal() {
            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-book"></i> Tambah Logbook Baru';
            document.getElementById('logbookForm').action = "<?php echo e(route('logbook-dpki.store')); ?>";
            document.getElementById('methodField').value = "POST";
            document.getElementById('logbookForm').reset();
            
            // Reset image previews
            document.getElementById('preview_sehat').style.display = 'none';
            document.getElementById('img_preview_sehat').src = '';
            document.getElementById('preview_mati').style.display = 'none';
            document.getElementById('img_preview_mati').src = '';
            document.getElementById('preview_rawan').style.display = 'none';
            document.getElementById('img_preview_rawan').src = '';
            document.getElementById('preview_lain').style.display = 'none';
            document.getElementById('img_preview_lain').src = '';
            
            // Reset toggles
            toggleKegiatanLain();
            toggleYangLainInput();
            
            // Reset Area
            document.getElementById('area').value = '';
            toggleAreaLain();
            
            // Reset Koordinat
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            const statusEl = document.getElementById('tree_lokasi_status');
            if (statusEl) statusEl.style.display = 'none';
            
            // Reset Bukan Koleksi
            document.getElementById('is_bukan_koleksi').checked = false;
            toggleBukanKoleksi();
            
            // Reset Mekolin radios
            document.querySelectorAll('input[name="kondisi_label_mekolin"]').forEach(el => el.checked = false);
            toggleMekolinLain();

            // Reset Seng radios
            document.querySelectorAll('input[name="kondisi_label_seng"]').forEach(el => el.checked = false);
            toggleSengLain();

            // Reset Pemeliharaan checkboxes
            document.querySelectorAll('input[name="pemeliharaan_label[]"]').forEach(el => el.checked = false);
            togglePemeliharaanLain();

            // Reset Pemeliharaan Rutin checkboxes
            document.querySelectorAll('input[name="pemeliharaan_rutin[]"]').forEach(el => el.checked = false);
            togglePemeliharaanRutinLain();

            // Reset Kondisi Tumbuhan radios
            document.querySelectorAll('input[name="kondisi_tumbuhan"]').forEach(el => el.checked = false);
            toggleKondisiTumbuhan();

            // Reset id_user to current logged-in user
            document.getElementById('id_user').value = "<?php echo e(auth()->user()->id_user); ?>";
            // Reset tree selector display
            document.getElementById('id_tree').value = '';
            document.getElementById('treeSelectedText').textContent = '-- Pilih Pohon --';
            document.getElementById('treeSelectedDisplay').classList.remove('has-value');
            
            // Reset Manual plant
            document.getElementById('is_manual_plant').checked = false;
            document.getElementById('nama_tumbuhan').value = '';
            document.getElementById('nama_genus').value = '';
            toggleManualPlant();
            
            // Reset Waktu & Set to current time
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('waktu_jam').value = `${hours}:${minutes}`;
            updateSesiWaktu();

            // Set create_at to current datetime
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('create_at').value = local;
            document.getElementById('logbookModal').classList.add('active');
        }

        function openEditModalLogbook(log) {
            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Logbook';
            document.getElementById('logbookForm').action = "/dashboard/logbook-dpki/" + log.id_logbook;
            document.getElementById('methodField').value = "PUT";

            document.getElementById('id_user').value = log.id_user;

            // Tree / Manual Plant
            if (log.id_tree) {
                document.getElementById('is_manual_plant').checked = false;
                toggleManualPlant();
                document.getElementById('id_tree').value = log.id_tree;
                const tree = TREE_DATA.find(t => t.id == log.id_tree);
                if (tree) {
                    selectTree(tree.id, tree.nama_lokal, tree.nama_jenis || '', tree.genus || '');
                } else {
                    document.getElementById('treeSelectedText').textContent = '-- Pilih Pohon --';
                    document.getElementById('treeSelectedDisplay').classList.remove('has-value');
                    document.getElementById('nama_genus').value = '';
                }
            } else if (log.nama_tumbuhan) {
                document.getElementById('is_manual_plant').checked = true;
                toggleManualPlant();
                document.getElementById('nama_tumbuhan').value = log.nama_tumbuhan;
                document.getElementById('nama_genus').value = log.nama_genus || '';
            } else {
                document.getElementById('is_manual_plant').checked = false;
                toggleManualPlant();
            }

            // Datetime
            document.getElementById('create_at').value = log.create_at ? log.create_at.substring(0, 16) : '';
            
            // Waktu & Sesi Logic
            if (log.waktu) {
                if (log.waktu.includes('/')) {
                    const parts = log.waktu.split('/');
                    document.getElementById('waktu_jam').value = parts[1].trim();
                } else if (log.waktu.includes(':')) {
                    document.getElementById('waktu_jam').value = log.waktu.trim();
                } else {
                    document.getElementById('waktu_jam').value = '';
                }
            } else {
                document.getElementById('waktu_jam').value = '';
            }
            updateSesiWaktu();
            
            // Area Logic
            const areaOptions = ["GHD (Green House Display)", "Jawa Bali 1", "Jawa Bali 2", "Jawa Bali 3", "Kalimantan", "Sumatra", "Sulawesi", "Nusa Tenggara", "Maluku", "Papua", "Tanaman Obat"];
            if (log.area) {
                if (areaOptions.includes(log.area)) {
                    document.getElementById('area').value = log.area;
                } else {
                    document.getElementById('area').value = "Lokasi Lainya";
                    document.getElementById('area_lain_input').value = log.area;
                }
            } else {
                document.getElementById('area').value = '';
            }
            toggleAreaLain();

            // Koordinat Logic
            document.getElementById('latitude').value = log.latitude || '';
            document.getElementById('longitude').value = log.longitude || '';

            document.getElementById('vak_koleksi').value = log.vak_koleksi || '';
            document.getElementById('no_vak').value = log.no_vak || '';
            
            if (log.no_vak === '-') {
                document.getElementById('is_bukan_koleksi').checked = true;
            } else {
                document.getElementById('is_bukan_koleksi').checked = false;
            }
            toggleBukanKoleksi();

            document.getElementById('jenis_kegiatan').value = log.jenis_kegiatan || '';
            
            // Modal Form Toggle Logic
            const mekolinRadios = document.querySelectorAll('input[name="kondisi_label_mekolin"]');
            const mekolinOptions = ["Masih bagus", "Rusak/lepas", "Tulisan tidak jelas", "Tidak berlabel"];
            let mekolinMatched = false;
            mekolinRadios.forEach(r => r.checked = false);
            
            if (log.kondisi_label_mekolin) {
                if (mekolinOptions.includes(log.kondisi_label_mekolin)) {
                    document.querySelector(`input[name="kondisi_label_mekolin"][value="${log.kondisi_label_mekolin}"]`).checked = true;
                    mekolinMatched = true;
                } else {
                    document.getElementById('mekolin_yang_lain').checked = true;
                    document.getElementById('mekolin_lain_input').value = log.kondisi_label_mekolin;
                }
            }
            toggleMekolinLain();

            // Seng Radio Logic
            const sengRadios = document.querySelectorAll('input[name="kondisi_label_seng"]');
            const sengOptions = ["Masih bagus", "Rusak/lepas", "Nomor seng salah", "Tidak berlabel seng"];
            let sengMatched = false;
            sengRadios.forEach(r => r.checked = false);
            
            if (log.kondisi_label_seng) {
                if (sengOptions.includes(log.kondisi_label_seng)) {
                    document.querySelector(`input[name="kondisi_label_seng"][value="${log.kondisi_label_seng}"]`).checked = true;
                    sengMatched = true;
                } else {
                    document.getElementById('seng_yang_lain').checked = true;
                    document.getElementById('seng_lain_input').value = log.kondisi_label_seng;
                }
            }
            toggleSengLain();

            // Pemeliharaan Label Checkbox Logic
            const pemeliharaanCb = document.querySelectorAll('input[name="pemeliharaan_label[]"]');
            const pemeliharaanOptions = ["Membersihkan label", "Mengganti label mekolin", "Menulis ulang identitas label mekolin", "Mengganti label seng", "Tidak ada"];
            pemeliharaanCb.forEach(c => c.checked = false);

            if (log.pemeliharaan_label) {
                const parts = log.pemeliharaan_label.split(',').map(s => s.trim());
                parts.forEach(p => {
                    if (pemeliharaanOptions.includes(p)) {
                        const cb = document.querySelector(`input[name="pemeliharaan_label[]"][value="${p}"]`);
                        if (cb) cb.checked = true;
                    } else {
                        document.getElementById('pemeliharaan_yang_lain').checked = true;
                        document.getElementById('pemeliharaan_lain_input').value = p;
                    }
                });
            }
            togglePemeliharaanLain();

            // Kondisi Tumbuhan Radio Logic
            const kondisiRadios = document.querySelectorAll('input[name="kondisi_tumbuhan"]');
            kondisiRadios.forEach(r => r.checked = false);
            if (log.kondisi_tumbuhan) {
                const r = document.querySelector(`input[name="kondisi_tumbuhan"][value="${log.kondisi_tumbuhan}"]`);
                if (r) r.checked = true;
            }
            toggleKondisiTumbuhan();

            // Pemeliharaan Rutin Checkbox Logic
            const rutins = document.querySelectorAll('input[name="pemeliharaan_rutin[]"]');
            rutins.forEach(cb => cb.checked = false);
            const rutinOptions = [
                "Membersihkan gulma di area perakaran (bobokor)",
                "Membersihkan batang/dahan dari epifit/parasit",
                "Pemangkasan dahan/cabang",
                "Penyiraman koleksi baru",
                "Pemupukan koleksi baru",
                "Penyiraman tanaman hias/border",
                "Tidak ada"
            ];
            
            if (log.pemeliharaan_rutin) {
                const arr = log.pemeliharaan_rutin.split(',').map(s => s.trim());
                let matchedLain = [];
                arr.forEach(val => {
                    if (rutinOptions.includes(val)) {
                        document.querySelectorAll(`input[name="pemeliharaan_rutin[]"][value="${val}"]`).forEach(cb => cb.checked = true);
                    } else {
                        matchedLain.push(val);
                    }
                });
                if (matchedLain.length > 0) {
                    const lainVal = matchedLain.join(', ');
                    ['pemeliharaan_rutin_yang_lain', 'pemeliharaan_rutin_rawan_yang_lain'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = true;
                    });
                    ['pemeliharaan_rutin_lain_input', 'pemeliharaan_rutin_rawan_lain_input'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = lainVal;
                    });
                }
            }
            togglePemeliharaanRutinLain();
            togglePemeliharaanRutinRawanLain();

            // Tingkat Sakit Radio Logic
            const tingkatOptions = ['Sakit ringan', 'Sakit sedang', 'Sakit berat'];
            document.querySelectorAll('input[name="tingkat_sakit"]').forEach(r => r.checked = false);
            if (log.tingkat_sakit) {
                if (tingkatOptions.includes(log.tingkat_sakit)) {
                    document.querySelector(`input[name="tingkat_sakit"][value="${log.tingkat_sakit}"]`).checked = true;
                } else {
                    document.getElementById('tingkat_sakit_yang_lain').checked = true;
                    document.getElementById('tingkat_sakit_lain_input').value = log.tingkat_sakit;
                }
            }
            toggleTingkatSakitLain();

            // Kategori Sakit Checkbox Logic
            const kategoriOptions = ['Akar sakit', 'Batang sakit', 'Daun sakit', 'Pertumbuhan tidak normal (kerdil, tajuk jarang, dll)'];
            document.querySelectorAll('input[name="kategori_sakit[]"]').forEach(cb => cb.checked = false);
            if (log.kategori_sakit) {
                const arr = log.kategori_sakit.split(',').map(s => s.trim());
                let lainArr = [];
                arr.forEach(val => {
                    if (kategoriOptions.includes(val)) {
                        const cb = document.querySelector(`input[name="kategori_sakit[]"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    } else {
                        lainArr.push(val);
                    }
                });
                if (lainArr.length > 0) {
                    document.getElementById('kategori_sakit_yang_lain').checked = true;
                    document.getElementById('kategori_sakit_lain_input').value = lainArr.join(', ');
                }
            }
            toggleKategoriSakitLain();

            // Penyebab Sakit Checkbox Logic
            const penyebabOptions = ['Jamur', 'Rayap', 'Ulat', 'Uret', 'Penggerek'];
            document.querySelectorAll('input[name="penyebab_sakit[]"]').forEach(cb => cb.checked = false);
            if (log.penyebab_sakit) {
                const arr = log.penyebab_sakit.split(',').map(s => s.trim());
                let lainPenyebab = [];
                arr.forEach(val => {
                    if (penyebabOptions.includes(val)) {
                        const cb = document.querySelector(`input[name="penyebab_sakit[]"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    } else if (val === 'Hama/penyakit lain') {
                        document.getElementById('penyebab_sakit_yang_lain').checked = true;
                    } else {
                        lainPenyebab.push(val);
                        document.getElementById('penyebab_sakit_yang_lain').checked = true;
                    }
                });
                if (lainPenyebab.length > 0) {
                    document.getElementById('penyebab_sakit_lain_input').value = lainPenyebab.join(', ');
                }
            }
            togglePenyebabSakitLain();

            // Penanganan Koleksi Sakit Checkbox Logic
            const penangananOptions = ['Pengendalian HPT', 'Pemberian salep kambium', 'Pemupukan', 'Penyiraman', 'Tidak ada'];
            document.querySelectorAll('input[name="penanganan_koleksi_sakit[]"]').forEach(cb => cb.checked = false);
            if (log.penanganan_koleksi_sakit) {
                const arr = log.penanganan_koleksi_sakit.split(',').map(s => s.trim());
                let lainPenanganan = [];
                arr.forEach(val => {
                    if (penangananOptions.includes(val)) {
                        document.querySelectorAll(`input[name="penanganan_koleksi_sakit[]"][value="${val}"]`).forEach(cb => cb.checked = true);
                    } else {
                        lainPenanganan.push(val);
                    }
                });
                if (lainPenanganan.length > 0) {
                    const lainVal = lainPenanganan.join(', ');
                    ['penanganan_sakit_yang_lain', 'penanganan_sakit_rawan_yang_lain'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = true;
                    });
                    ['penanganan_sakit_lain_input', 'penanganan_sakit_rawan_lain_input'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = lainVal;
                    });
                }
            }
            togglePenangananSakitLain();
            togglePenangananSakitRawanLain();

            // Populate kategori_rawan checkboxes
            const kategoriRawanOptions = ['Rawan patah', 'Rawan tumbang'];
            document.querySelectorAll('input[name="kategori_rawan[]"]').forEach(cb => cb.checked = false);
            document.getElementById('kategori_rawan_yang_lain').checked = false;
            document.getElementById('kategori_rawan_lain_input').value = '';
            if (log.kategori_rawan) {
                const kateg = log.kategori_rawan.split(',').map(s => s.trim()).filter(Boolean);
                const lainKateg = [];
                kateg.forEach(val => {
                    if (kategoriRawanOptions.includes(val)) {
                        const cb = document.querySelector(`input[name="kategori_rawan[]"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    } else {
                        lainKateg.push(val);
                    }
                });
                if (lainKateg.length > 0) {
                    document.getElementById('kategori_rawan_yang_lain').checked = true;
                    document.getElementById('kategori_rawan_lain_input').value = lainKateg.join(', ');
                }
            }
            toggleKategoriRawanLain();

            const rawanOptions = [
                'Penegakkan/mendirikan koleksi tumbang',
                'Pemangkasan batang/dahan/cabang rawan',
                'Penebangan tumbuhan rawan',
                'Pemangkasan/penebangan seboom',
                'Pemangkasan/penebangan stembom',
                'Pemasangan sling atau penyangga',
                'Pemasangan tanda peringatan/bahaya',
                'Pemasangan pembatas area (police line)',
                'Tidak ada'
            ];
            document.querySelectorAll('input[name="penanganan_tumbuhan_rawan[]"]').forEach(cb => cb.checked = false);
            document.getElementById('penanganan_rawan_yang_lain').checked = false;
            document.getElementById('penanganan_rawan_lain_input').value = '';

            if (log.penanganan_tumbuhan_rawan) {
                const arr = log.penanganan_tumbuhan_rawan.split(',').map(s => s.trim()).filter(Boolean);
                let lainArr = [];
                arr.forEach(val => {
                    if (rawanOptions.includes(val)) {
                        const cb = document.querySelector(`input[name="penanganan_tumbuhan_rawan[]"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    } else {
                        lainArr.push(val);
                    }
                });
                if (lainArr.length > 0) {
                    document.getElementById('penanganan_rawan_yang_lain').checked = true;
                    document.getElementById('penanganan_rawan_lain_input').value = lainArr.join(', ');
                }
            }
            togglePenangananRawanLain();
            togglePenangananSakitRawanLain();
            togglePemeliharaanRutinRawanLain();
            document.getElementById('kondisi_koleksi_mati').value = log.kondisi_koleksi_mati || '';

            // Handle images
            if (log.dokumentasi_kegiatan_sehat) {
                document.getElementById('preview_sehat').style.display = 'block';
                document.getElementById('img_preview_sehat').src = '/' + log.dokumentasi_kegiatan_sehat;
            } else {
                document.getElementById('preview_sehat').style.display = 'none';
                document.getElementById('img_preview_sehat').src = '';
            }

            if (log.dokumentasi_kegiatan) {
                if (log.kondisi_tumbuhan === 'Rawan') {
                    document.getElementById('preview_rawan').style.display = 'block';
                    document.getElementById('img_preview_rawan').src = '/' + log.dokumentasi_kegiatan;
                    document.getElementById('preview_mati').style.display = 'none';
                    document.getElementById('img_preview_mati').src = '';
                } else {
                    document.getElementById('preview_mati').style.display = 'block';
                    document.getElementById('img_preview_mati').src = '/' + log.dokumentasi_kegiatan;
                    document.getElementById('preview_rawan').style.display = 'none';
                    document.getElementById('img_preview_rawan').src = '';
                }
                document.getElementById('preview_lain').style.display = 'block';
                document.getElementById('img_preview_lain').src = '/' + log.dokumentasi_kegiatan;
            } else {
                document.getElementById('preview_mati').style.display = 'none';
                document.getElementById('img_preview_mati').src = '';
                document.getElementById('preview_rawan').style.display = 'none';
                document.getElementById('img_preview_rawan').src = '';
                document.getElementById('preview_lain').style.display = 'none';
                document.getElementById('img_preview_lain').src = '';
            }

            // Handle checkboxes for kegiatan_lain
            document.querySelectorAll('input[name="kegiatan_lain[]"]').forEach(cb => cb.checked = false);
            document.getElementById('kegiatan_lain_input').value = '';
            if (log.kegiatan_lain) {
                const activities = log.kegiatan_lain.split(',').map(s => s.trim());
                activities.forEach(activity => {
                    const cb = document.querySelector(`input[name="kegiatan_lain[]"][value="${activity}"]`);
                    if (cb) {
                        cb.checked = true;
                    } else if (activity !== '') {
                        document.getElementById('kegiatan_lain_yang_lain').checked = true;
                        document.getElementById('kegiatan_lain_input').value = activity;
                    }
                });
            }

            toggleKegiatanLain();
            toggleYangLainInput();

            document.getElementById('logbookModal').classList.add('active');
        }

        function closeLogbookModal() {
            document.getElementById('logbookModal').classList.remove('active');
        }

        // Toggle modal fullscreen for better visibility on small viewports
        function toggleModalFullscreen(containerId) {
            const c = document.getElementById(containerId);
            if (!c) return;
            const icon = document.getElementById('logbookFullscreenIcon');
            if (c.dataset.full === '1') {
                // restore
                c.style.position = '';
                c.style.top = '';
                c.style.left = '';
                c.style.width = '';
                c.style.height = '';
                c.style.maxWidth = 'min(780px, calc(100% - 40px))';
                c.style.margin = '24px auto';
                c.style.borderRadius = '';
                c.style.overflow = 'hidden';
                c.dataset.full = '0';
                if (icon) icon.className = 'fa-solid fa-expand';
            } else {
                // go fullscreen within viewport
                c.style.position = 'fixed';
                c.style.top = '0';
                c.style.left = '0';
                c.style.width = '100%';
                c.style.height = '100vh';
                c.style.maxWidth = '100%';
                c.style.margin = '0';
                c.style.borderRadius = '0';
                c.style.overflow = 'auto';
                c.dataset.full = '1';
                if (icon) icon.className = 'fa-solid fa-compress';
            }
        }

        // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Modal: Detail ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬
        function parseLogbookData(button) {
            if (!button) return {};
            if (button && typeof button === 'object' && !button.getAttribute) {
                return button || {};
            }
            try {
                const raw = button.getAttribute('data-logbook') || button.dataset.logbook || '';
                if (!raw) return {};
                const parsed = JSON.parse(raw);
                return parsed || {};
            } catch (e) {
                console.error('Gagal mem-parsing data logbook:', e);
                return {};
            }
        }

        function openDetailModalFromButton(button) {
            if (!button) return;
            const log = parseLogbookData(button);
            return openDetailModalLogbook(log);
        }

        function openEditModalFromButton(button) {
            if (!button) return;
            const log = parseLogbookData(button);
            return openEditModalLogbook(log);
        }

        function initLogbookActionButtons() {
            document.querySelectorAll('.logbook-detail-btn').forEach(function(button) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openDetailModalFromButton(this);
                });
            });

            document.querySelectorAll('.logbook-edit-btn').forEach(function(button) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditModalFromButton(this);
                });
            });
        }

        document.addEventListener('DOMContentLoaded', initLogbookActionButtons);

        // Fallback: event delegation to capture clicks even if buttons are added/modified later
        document.addEventListener('click', function(e) {
            var btn = e.target.closest && e.target.closest('.logbook-detail-btn');
            if (btn) {
                try { e.preventDefault(); e.stopPropagation(); } catch (er) {}
                return openDetailModalFromButton(btn);
            }
            var editBtn = e.target.closest && e.target.closest('.logbook-edit-btn');
            if (editBtn) {
                try { e.preventDefault(); e.stopPropagation(); } catch (er) {}
                return openEditModalFromButton(editBtn);
            }
        });

        function openDetailModalLogbook(log) {
            var body = document.getElementById('detailContentLogbook');
            var modal = document.getElementById('detailModalLogbook');
            if (!body || !modal) return;
            log = log || {};

            function escapeHtml(value) {
                if (value === null || value === undefined || value === '') return '';
                return String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function fmt(v) {
                if (v === null || v === undefined || v === '') return '<span style="color:#94a3b8">-</span>';
                return escapeHtml(String(v));
            }

            function fmtDate(v) {
                if (!v) return '-';
                var dateStr = v;
                if (typeof v === 'object' && v !== null && v.date) {
                    dateStr = v.date;
                }
                if (typeof dateStr !== 'string') return '-';
                if (dateStr.indexOf(' ') !== -1) {
                    dateStr = dateStr.replace(' ', 'T');
                }
                var d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                return d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
            }

            function fmtCoord(lat, lng) {
                var parts = [];
                if (lat !== null && lat !== undefined && lat !== '') parts.push('Lat: ' + escapeHtml(String(lat)));
                if (lng !== null && lng !== undefined && lng !== '') parts.push('Lng: ' + escapeHtml(String(lng)));
                return parts.length ? parts.join('<br>') : '<span style="color:#94a3b8">-</span>';
            }

            function row(label, value) {
                return '<div class="detail-row"><span>' + escapeHtml(label) + '</span><span>' + (value || '<span style="color:#94a3b8">-</span>') + '</span></div>';
            }

            function section(icon, title, rows) {
                return '<div class="detail-card"><strong class="section-label"><i class="fa-solid fa-' + icon + '"></i> ' + escapeHtml(title) + '</strong>' + rows + '</div>';
            }

            function listValue(value) {
                if (!value) return '<span style="color:#94a3b8">-</span>';
                var items = String(value).split(',').map(function(item) { return item.trim(); }).filter(Boolean);
                if (!items.length) return '<span style="color:#94a3b8">-</span>';
                var listHtml = '<ul style="margin:4px 0 0;padding-left:16px;font-size:0.9rem;">';
                items.forEach(function(item) {
                    listHtml += '<li>' + escapeHtml(item) + '</li>';
                });
                listHtml += '</ul>';
                return listHtml;
            }

            function normalizeKondisiTumbuhan(value) {
                if (!value) return '';
                var normalized = String(value).trim().toLowerCase();
                if (normalized === 'sakit' || normalized === 'sakit/merana' || normalized === 'sakit / merana' || normalized === 'merana') {
                    return 'Sakit';
                }
                if (normalized === 'sehat') return 'Sehat';
                if (normalized === 'rawan') return 'Rawan';
                if (normalized === 'mati') return 'Mati';
                return String(value).trim();
            }

            function photoLink(path) {
                if (!path) return '<span style="color:#94a3b8">-</span>';
                return '<a href="/' + path + '" target="_blank" style="color:var(--accent-color);"><i class="fa-solid fa-image"></i> Lihat Foto</a>';
            }

            var html = '<div class="detail-grid">';

            // Header
            html += '<div class="detail-card full" style="background:rgba(16,185,129,0.05);border-left:4px solid var(--accent-color);">';
            html += '<p style="margin:0;font-size:1.05rem;font-weight:700;color:var(--primary-color);"><i class="fa-solid fa-book" style="color:var(--accent-color);"></i> Logbook #' + fmt(log.id_logbook) + '</p>';
            html += '<p style="margin:4px 0 0;font-size:0.85rem;color:var(--text-secondary);">' + fmtDate(log.create_at) + '</p>';
            html += '</div>';

            // Petugas
            var nama = (log.user && log.user.nama_user) ? log.user.nama_user : '';
            var role = (log.user && log.user.role) ? (log.user.role.charAt(0).toUpperCase() + log.user.role.slice(1)) : '';
            html += section('user-tie', 'Petugas', row('Nama', fmt(nama)) + row('Role', fmt(role)));

            // Pohon
            var pohonRows = '';
            if (log.tree) {
                pohonRows = row('Nama Lokal', fmt(log.tree.nama_lokal)) + row('Nama Ilmiah', '<em>' + fmt(log.tree.nama_jenis) + '</em>') + row('Genus', fmt(log.tree.genus));
            } else {
                pohonRows = row('Nama Tumbuhan', fmt(log.nama_tumbuhan)) + row('Genus', fmt(log.nama_genus));
            }
            html += section('tree', 'Pohon / Tumbuhan', pohonRows);

            // Data utama form
            html += section('clipboard-list', 'Data Form yang Diisi',
                row('Tanggal Kegiatan', fmtDate(log.create_at)) +
                row('Waktu', fmt(log.waktu)) +
                row('Area', fmt(log.area)) +
                row('Vak Koleksi', fmt(log.vak_koleksi)) +
                row('No. Vak', fmt(log.no_vak)) +
                row('Koordinat', fmtCoord(log.latitude, log.longitude)) +
                row('Jenis Kegiatan', fmt(log.jenis_kegiatan)) +
                row('Kondisi Tumbuhan', fmt(log.kondisi_tumbuhan))
            );

            // Kondisi Label (jika ada)
            if (log.kondisi_label_mekolin || log.kondisi_label_seng || log.pemeliharaan_label) {
                html += section('tag', 'Kondisi Label',
                    row('Label Mekolin', fmt(log.kondisi_label_mekolin)) +
                    row('Label Seng', fmt(log.kondisi_label_seng)) +
                    row('Pemeliharaan Label', listValue(log.pemeliharaan_label))
                );
            }

            // Kondisi spesifik
            var kondisiTumbuhan = normalizeKondisiTumbuhan(log.kondisi_tumbuhan);
            if (kondisiTumbuhan === 'Sehat') {
                html += section('leaf', 'Tumbuhan Sehat',
                    row('Pemeliharaan Rutin', listValue(log.pemeliharaan_rutin)) +
                    row('Dokumentasi', photoLink(log.dokumentasi_kegiatan_sehat))
                );
            } else if (kondisiTumbuhan === 'Sakit') {
                html += section('virus', 'Sakit / Merana',
                    row('Tingkat Sakit', fmt(log.tingkat_sakit)) +
                    row('Kategori Sakit', listValue(log.kategori_sakit)) +
                    row('Penyebab', listValue(log.penyebab_sakit)) +
                    row('Penanganan', listValue(log.penanganan_koleksi_sakit)) +
                    row('Dokumentasi', photoLink(log.dokumentasi_kegiatan))
                );
            } else if (kondisiTumbuhan === 'Rawan') {
                html += section('triangle-exclamation', 'Tumbuhan Rawan',
                    row('Kategori Rawan', listValue(log.kategori_rawan)) +
                    row('Penanganan Sakit/Merana', listValue(log.penanganan_koleksi_sakit)) +
                    row('Penanganan Rawan', listValue(log.penanganan_tumbuhan_rawan)) +
                    row('Pemeliharaan Rutin', listValue(log.pemeliharaan_rutin)) +
                    row('Dokumentasi', photoLink(log.dokumentasi_kegiatan))
                );
            } else if (kondisiTumbuhan === 'Mati') {
                html += section('skull-crossbones', 'Tumbuhan Mati',
                    row('Kondisi Koleksi Mati', fmt(log.kondisi_koleksi_mati)) +
                    row('Dokumentasi', photoLink(log.dokumentasi_kegiatan))
                );
            }

            // Kegiatan Lain
            if (log.kegiatan_lain) {
                html += '<div class="detail-card full"><strong class="section-label"><i class="fa-solid fa-notes-medical"></i> Kegiatan Lainnya</strong>' + listValue(log.kegiatan_lain) + '</div>';
            }

            // Timestamps
            html += '<div class="detail-card full" style="border-top:1px solid var(--border-color);">';
            html += '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);">';
            html += '<span><i class="fa-solid fa-clock"></i> Dibuat: ' + fmtDate(log.create_at) + '</span>';
            html += '<span><i class="fa-solid fa-pen"></i> Diperbarui: ' + fmtDate(log.updated_at) + '</span>';
            html += '</div></div>';

            html += '</div>';
            body.innerHTML = html;
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.add('active');
        }

        function closeDetailModalLogbook() {
            var modal = document.getElementById('detailModalLogbook');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = '';
                modal.style.visibility = '';
                modal.style.opacity = '';
            }
        }

        // Close modal when clicking on overlay
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.remove('active');
                    }
                });
            });
        });
    </script>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
</body>
</html>
















<?php /**PATH C:\laragon\www\baru\resources\views/logbook.blade.php ENDPATH**/ ?>