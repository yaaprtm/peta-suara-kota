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
</head>
<body>

    <div class="dashboard-container">
        
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
                <a href="/dashboard" class="menu-item <?php echo e(Request::is('dashboard') ? 'active' : ''); ?>">
                    <span class="menu-item-left" data-i18n="nav_overview"><i class="fa-solid fa-chart-pie"></i> Overview</span>
                </a>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-info-artikel')): ?>
                <a href="<?php echo e(route('dashboard.artikel')); ?>" class="menu-item <?php echo e(Request::is('dashboard/artikel*') ? 'active' : ''); ?>">
                    <span class="menu-item-left" data-i18n="nav_artikel"><i class="fa-solid fa-newspaper"></i> Info Artikel</span>
                </a>
                <?php endif; ?>
                <?php
                    $lapBadge = (Gate::allows('read-laporan'))
                        ? \App\Models\Laporan::countByStatus()
                        : collect();

                    $pending  = $lapBadge['Pending'] ?? 0;
                    $diproses = $lapBadge['Diproses'] ?? 0;
                    $selesai  = $lapBadge['Selesai'] ?? 0;
                    $ditolak  = $lapBadge['Ditolak'] ?? 0;
                ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-laporan')): ?>
<a href="/dashboard/laporan" class="menu-item <?php echo e(Request::is('dashboard/laporan*') ? 'active' : ''); ?>">
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
                        <?php if($pending == 0 && $diproses == 0 && $selesai == 0 && $ditolak == 0): ?>
                            <span class="menu-badge" style="background-color: #94a3b8;" title="Tidak ada laporan">0</span>
                        <?php endif; ?>
                    </div>
                </a>
<?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('manage-users')): ?>
                <a href="<?php echo e(route('dashboard.pengguna')); ?>" class="menu-item <?php echo e(Request::is('dashboard/pengguna*') ? 'active' : ''); ?>">
                    <span class="menu-item-left" data-i18n="nav_pengguna"><i class="fa-solid fa-users"></i> Pengguna</span>
                </a>
                <?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-tree')): ?>
<a href="<?php echo e(route('dashboard.tree')); ?>" class="menu-item <?php echo e(Request::is('dashboard/tree*') ? 'active' : ''); ?>">
                    <span class="menu-item-left"><i class="fa-solid fa-tree"></i> Tree (Pohon)</span>
                </a>
<?php endif; ?>
                <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-logbook')): ?>
<a href="<?php echo e(route('dashboard.logbook-dpki')); ?>" class="menu-item <?php echo e(Request::is('dashboard/logbook-dpki*') ? 'active' : ''); ?>">
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

        <!-- ================= MAIN CONTENT AREA ================= -->
        <main class="main-content">
            
            <!-- Topbar (Search & Profile) -->
            <header class="top-nav">
                <div class="current-date" style="font-weight: 500; color: var(--text-secondary); font-size: 1.05rem;">
                    <i class="fa-regular fa-calendar" style="margin-right: 8px;"></i>
                    <?php echo e(\Carbon\Carbon::now('Asia/Jakarta')->locale('id')->translatedFormat('l, d F Y')); ?>

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

            <div class="welcome-banner">
                <div class="welcome-left">
                    <div class="welcome-icon-box">
                        <i class="fa-solid fa-house"></i>
                    </div>
                    <h2><span data-i18n="welcome_back">Selamat datang kembali,</span> <?php echo e(auth()->user()->nama_user ?? 'root'); ?></h2>
                </div>
            </div>

            <!-- Section Header Laporan -->
            <div class="section-title-container" style="margin-top: 10px; margin-bottom: -10px;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-file-invoice"></i> <span data-i18n="stats_title_laporan">Statistik Laporan</span>
                </h3>
            </div>

            <!-- Top Stats Row (Real Layout stats) -->
            <div class="stats-row">
                <div class="stat-card" style="border-left: 4px solid var(--accent-color);">
                    <div class="stat-value"><?php echo e($laporanMasukHariIni); ?></div>
                    <div class="stat-label" data-i18n="laporan_hari_ini">Laporan Masuk Hari Ini</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--accent-color);">
                    <div class="stat-value"><?php echo e($laporanBulanIni); ?></div>
                    <div class="stat-label" data-i18n="laporan_bulan_ini">Laporan Masuk Bulan Ini</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--accent-color);">
                    <div class="stat-value"><?php echo e($laporanTahunIni); ?></div>
                    <div class="stat-label" data-i18n="laporan_tahun_ini">Laporan Masuk Tahun Ini</div>
                </div>
            </div>

            <!-- Section Header Artikel -->
            <div class="section-title-container" style="margin-top: 15px; margin-bottom: -10px;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-newspaper"></i> <span data-i18n="stats_title_artikel">Statistik Artikel</span>
                </h3>
            </div>

            <!-- Artikel Stats Row -->
            <div class="stats-row">
                <div class="stat-card" style="border-left: 4px solid #10b981;">
                    <div class="stat-value"><?php echo e($totalArtikel); ?></div>
                    <div class="stat-label" data-i18n="total_artikel">Total Artikel</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #07943dff;">
                    <div class="stat-value"><?php echo e($artikelTerbit); ?></div>
                    <div class="stat-label" data-i18n="artikel_terbit">Artikel Terbit</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #05502aff;">
                    <div class="stat-value"><?php echo e($artikelDraft); ?></div>
                    <div class="stat-label" data-i18n="artikel_draft">Artikel Draft</div>
                </div>
            </div>

            <!-- Two Column Layout (Real Layout content) -->
            <div class="content-grid">
                
                <!-- Left Column -->
                <div class="left-col">
                    
                    <!-- Carousel Info (Artikel) -->
                    <div class="carousel-card">
                        <button class="carousel-btn prev-btn" onclick="prevSlide()"><i class="fa-solid fa-chevron-left"></i></button>
                        
                        <div class="carousel-slides">
                            <?php $__currentLoopData = $artikel; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <div class="carousel-slide <?php echo e($index === 0 ? 'active' : ''); ?>" id="slide-<?php echo e($index); ?>">
                                    <div class="slide-content">
                                        <h3><?php echo e($item->judul); ?></h3>
                                        <p><?php echo e(Str::limit($item->deskripsi, 120)); ?></p>
                                    </div>
                                    <?php if(isset($item->gambar_url)): ?>
                                        <div class="slide-image-container">
                                            <img src="<?php echo e((str_starts_with($item->gambar_url, 'http') || str_starts_with($item->gambar_url, '/')) ? $item->gambar_url : '/' . $item->gambar_url); ?>" alt="<?php echo e($item->judul); ?>" class="slide-image">
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </div>
                        
                        <button class="carousel-btn next-btn" onclick="nextSlide()"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>

                    <!-- Charts Grid containing Laporan and Artikel bar charts -->
                    <div class="charts-grid">
                        <!-- Bar Chart Section (Laporan) -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 data-i18n="chart_title_laporan">Statistik Laporan Bulanan</h3>
                            </div>
                            <div class="bar-chart">
                                <?php $__currentLoopData = $monthlyCounts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $month => $count): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                    <div class="chart-bar-container">
                                        <div class="bar-wrapper">
                                            <div class="chart-bar" style="height: <?php echo e(max(10, ($count / $maxMonthlyCount) * 100)); ?>%;" data-tooltip="<?php echo e($count); ?> Laporan"></div>
                                        </div>
                                        <span class="bar-label"><?php echo e($month); ?></span>
                                    </div>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                            </div>
                        </div>

                        <!-- Pie Chart Section (Koleksi vs Non-Koleksi) -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3><i class="fa-solid fa-chart-pie" style="color: var(--accent-color);"></i> Chart Status Koleksi</h3>
                            </div>
                            <?php
                                $totalTrees     = $treeKoleksi + $treeNonKoleksi;
                                $koleksiPct     = $totalTrees > 0 ? round(($treeKoleksi    / $totalTrees) * 100) : 0;
                                $nonKoleksiPct  = $totalTrees > 0 ? round(($treeNonKoleksi / $totalTrees) * 100) : 0;
                            ?>
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 16px 0 8px; gap: 16px;">
                                <!-- Canvas -->
                                <div style="position:relative; width:180px; height:180px;">
                                    <canvas id="pieKoleksi" width="180" height="180"></canvas>
                                    <!-- Center label -->
                                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none;">
                                        <div style="font-size:1.5rem; font-weight:800; color:var(--text-primary); line-height:1;"><?php echo e($totalTrees); ?></div>
                                        <div style="font-size:0.68rem; color:var(--text-secondary); font-weight:600; letter-spacing:0.03em; margin-top:2px;">TOTAL POHON</div>
                                    </div>
                                </div>
                                <!-- Legend -->
                                <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="width:13px;height:13px;border-radius:4px;background:linear-gradient(135deg,#10b981,#059669);display:inline-block;box-shadow:0 2px 4px rgba(16,185,129,.4);flex-shrink:0;"></span>
                                        <div>
                                            <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">Koleksi</div>
                                            <div style="font-size:0.7rem;color:var(--text-secondary);"><?php echo e($treeKoleksi); ?> pohon &middot; <?php echo e($koleksiPct); ?>%</div>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="width:13px;height:13px;border-radius:4px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:inline-block;box-shadow:0 2px 4px rgba(59,130,246,.4);flex-shrink:0;"></span>
                                        <div>
                                            <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">Non-Koleksi</div>
                                            <div style="font-size:0.7rem;color:var(--text-secondary);"><?php echo e($treeNonKoleksi); ?> pohon &middot; <?php echo e($nonKoleksiPct); ?>%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pie Chart Section (Status IUCN) -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3><i class="fa-solid fa-chart-pie" style="color: var(--accent-color);"></i> Chart Status IUCN</h3>
                            </div>
                            <?php
                                $iucnTotal = array_sum($iucnData);
                                $iucnColorMap = [
                                    'NE' => '#22c55e',
                                    'DD' => '#3b82f6',
                                    'LC' => '#06b6d4',
                                    'NT' => '#fb923c',
                                    'VU' => '#fbbf24',
                                    'EN' => '#ef4444',
                                    'CR' => '#e879f9',
                                    'EW' => '#0ea5e9',
                                    'EX' => '#f472b6',
                                ];
                            ?>
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 16px 0 8px; gap: 16px;">
                                <div style="position:relative; width:180px; height:180px;">
                                    <canvas id="pieIucn" width="180" height="180"></canvas>
                                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none;">
                                        <div style="font-size:1.5rem; font-weight:800; color:var(--text-primary); line-height:1;"><?php echo e($iucnTotal); ?></div>
                                        <div style="font-size:0.68rem; color:var(--text-secondary); font-weight:600; letter-spacing:0.03em; margin-top:2px;">TOTAL POHON</div>
                                    </div>
                                </div>
                                <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center; width:100%;">
                                    <?php $__currentLoopData = $iucnLabels; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $label): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <div style="display:flex; align-items:flex-start; gap:8px; min-width: 140px; max-width: 220px;">
                                            <span style="width:13px;height:13px;border-radius:4px;background:<?php echo e($iucnColorMap[$label] ?? '#94a3b8'); ?>;display:inline-block;box-shadow:0 2px 4px rgba(0,0,0,.12);flex-shrink:0;"></span>
                                            <div>
                                                <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);"><?php echo e($label); ?></div>
                                                <div style="font-size:0.7rem;color:var(--text-secondary);"><?php echo e($iucnData[$index]); ?> pohon &middot; <?php echo e($iucnTotal ? round(($iucnData[$index] / $iucnTotal) * 100) : 0); ?>%</div>
                                            </div>
                                        </div>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </div>
                            </div>
                        </div>

                        <!-- Bar Chart Section (Artikel) -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 data-i18n="chart_title_artikel">Statistik Artikel Bulanan</h3>
                            </div>
                            <div class="bar-chart">
                                <?php $__currentLoopData = $monthlyArtikelCounts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $month => $count): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                    <div class="chart-bar-container">
                                        <div class="bar-wrapper">
                                            <div class="chart-bar" style="height: <?php echo e(max(10, ($count / $maxMonthlyArtikelCount) * 100)); ?>%; background: linear-gradient(180deg, #3b82f6 0%, #93c5fd 100%);" data-tooltip="<?php echo e($count); ?> Artikel"></div>
                                        </div>
                                        <span class="bar-label"><?php echo e($month); ?></span>
                                    </div>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                            </div>
                        </div>
                    </div>

                    <!-- Ringkasan Laporan -->
                    <div class="reports-summary-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                            <h3 data-i18n="ringkasan_laporan" style="margin: 0; font-size: 1.1rem; font-weight: 600;">Ringkasan Laporan</h3>
                            <div style="position: relative; display: flex; align-items: center; width: 100%; max-width: 200px;">
                                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; color: var(--text-secondary); font-size: 0.85rem;"></i>
                                <input type="text" id="summarySearch" placeholder="Cari laporan..." style="padding: 8px 12px 8px 30px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 0.85rem; outline: none; background: rgba(255, 255, 255, 0.4); color: var(--text-primary); transition: all 0.3s ease; width: 100%;">
                            </div>
                        </div>
                        <table class="summary-table">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">Foto</th>
                                    <th>Title</th>
                                    <th>Detail</th>
                                </tr>
                            </thead>
                            <tbody id="summaryTableBody">
                                <?php $__empty_1 = true; $__currentLoopData = $ringkasanLaporan; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $report): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                    <tr class="report-row">
                                        <td style="vertical-align: middle;">
                                            <?php
                                                $fotoPath = $report->foto_before ?: $report->foto_after;
                                            ?>
                                            <?php if($fotoPath): ?>
                                                <img src="/<?php echo e($fotoPath); ?>" alt="<?php echo e($report->judul); ?>" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); display: block;">
                                            <?php else: ?>
                                                <div style="width: 50px; height: 50px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                                                    <i class="fa-regular fa-image" style="font-size: 1.2rem;"></i>
                                                </div>
                                            <?php endif; ?>
                                        </td>
                                        <td class="report-title" style="vertical-align: middle; font-weight: 600;"><?php echo e($report->judul); ?></td>
                                        <td class="report-detail" style="vertical-align: middle;"><?php echo e(Str::limit($report->deskripsi, 60)); ?></td>
                                    </tr>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                    <tr>
                                        <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 20px 10px;" data-i18n="empty_laporan">Belum ada laporan masuk.</td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                </div>

                <!-- Right Column -->
                <div class="right-col">
                    
                    <!-- Pelapor Terkini -->
                    <div class="reporter-card">
                        <h3 data-i18n="pelapor_terkini">Pelapor terkini</h3>
                        <div class="reporter-list">
                            <?php $__empty_1 = true; $__currentLoopData = $pelaporTerkini; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $name): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <div class="reporter-item">
                                    <div class="reporter-avatar">
                                        <?php if($name !== '--'): ?>
                                            <?php echo e(substr($name, 0, 1)); ?>

                                        <?php endif; ?>
                                    </div>
                                    <span class="reporter-name"><?php echo e($name); ?></span>
                                </div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <div style="text-align: center; color: var(--text-secondary); padding: 10px 0; font-size: 0.9rem;" data-i18n="empty_laporan">Belum ada laporan masuk.</div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Pembuat Post Terkini -->
                    <div class="reporter-card">
                        <h3 data-i18n="pembuat_post_terkini">Pembuat post terkini</h3>
                        <div class="reporter-list">
                            <?php $__empty_1 = true; $__currentLoopData = $pembuatPostTerkini; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $name): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <div class="reporter-item">
                                    <div class="reporter-avatar" style="background-color: #3b82f6; color: white;">
                                        <?php if($name !== '--'): ?>
                                            <?php echo e(substr($name, 0, 1)); ?>

                                        <?php endif; ?>
                                    </div>
                                    <span class="reporter-name"><?php echo e($name); ?></span>
                                </div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <div style="text-align: center; color: var(--text-secondary); padding: 10px 0; font-size: 0.9rem;" data-i18n="empty_artikel">Belum ada artikel yang dibuat.</div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Leaderboard Kontributor -->
                    <div class="reporter-card">
                        <h3 data-i18n="leaderboard_title">Leaderboard Kontributor</h3>
                        <div class="reporter-list">
                            <?php $__empty_1 = true; $__currentLoopData = $topUsers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $u): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <div class="reporter-item" style="justify-content: space-between; align-items: center; width: 100%;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-weight: 700; width: 20px; color: var(--text-secondary); font-size: 0.9rem;">
                                            #<?php echo e($index + 1); ?>

                                        </span>
                                        <div class="reporter-avatar" style="background-color: #f59e0b; color: white; width: 32px; height: 32px; font-size: 0.9rem;">
                                            <?php echo e(substr($u->nama_user, 0, 1)); ?>

                                        </div>
                                        <span class="reporter-name" style="font-size: 0.9rem;"><?php echo e($u->nama_user); ?></span>
                                    </div>
                                    <span style="background-color: #f0fdf4; color: #16a34a; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid #dcfce7;">
                                        <?php echo e($u->total_laporan); ?> Laporan
                                    </span>
                                </div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <div style="text-align: center; color: var(--text-secondary); padding: 10px 0; font-size: 0.9rem;" data-i18n="empty_pengguna">Belum ada pengguna terdaftar.</div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Decorative Botanical Cibinong Card -->
                    <div class="deco-card">
                        <div class="deco-inner">
                            <i class="fa-solid fa-tree deco-icon"></i>
                            <h4>Kebun Raya Cibinong</h4>
                            <p>Sistem Pemantauan Lingkungan & Konservasi Hijau</p>
                        </div>
                    </div>

                </div>

            </div>

        </main>

    </div>

    <!-- Carousel Javascript -->
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.carousel-slide');
        
        function showSlide(index) {
            if (slides.length === 0) return;
            slides.forEach(slide => slide.classList.remove('active'));
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        document.addEventListener('DOMContentLoaded', function() {
            const prevBtn = document.querySelector('.prev-btn');
            const nextBtn = document.querySelector('.next-btn');

            if (slides.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }

            if (slides.length > 1) {
                setInterval(nextSlide, 5000);
            }

            // Real-time table filter for Ringkasan Laporan
            const searchInput = document.getElementById('summarySearch');
            const tableRows = document.querySelectorAll('#summaryTableBody .report-row');

            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const query = this.value.toLowerCase().trim();
                    tableRows.forEach(row => {
                        const title = row.querySelector('.report-title').textContent.toLowerCase();
                        const detail = row.querySelector('.report-detail').textContent.toLowerCase();
                        if (title.includes(query) || detail.includes(query)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            }
        });
    </script>

    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        // ── Donut Chart: Koleksi vs Non-Koleksi ──────────────────────────────
        (function() {
            const koleksi    = <?php echo e($treeKoleksi); ?>;
            const nonKoleksi = <?php echo e($treeNonKoleksi); ?>;
            const total      = koleksi + nonKoleksi;

            const canvas = document.getElementById('pieKoleksi');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Gradient green
            const gradGreen = ctx.createLinearGradient(0, 0, 180, 180);
            gradGreen.addColorStop(0, '#10b981');
            gradGreen.addColorStop(1, '#059669');

            // Gradient blue
            const gradBlue = ctx.createLinearGradient(180, 0, 0, 180);
            gradBlue.addColorStop(0, '#3b82f6');
            gradBlue.addColorStop(1, '#2563eb');

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Koleksi', 'Non-Koleksi'],
                    datasets: [{
                        data: total > 0 ? [koleksi, nonKoleksi] : [1, 1],
                        backgroundColor: [gradGreen, gradBlue],
                        borderWidth: 3,
                        borderColor: 'transparent',
                        hoverOffset: 6
                    }]
                },
                options: {
                    cutout: '68%',
                    responsive: false,
                    animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: total > 0,
                            callbacks: {
                                label: function(ctx) {
                                    const val = ctx.parsed;
                                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                                    return ` ${val} pohon (${pct}%)`;
                                }
                            },
                            backgroundColor: 'rgba(15,23,42,0.85)',
                            padding: 10,
                            cornerRadius: 8,
                            titleFont: { weight: '700' },
                            bodyFont: { size: 13 }
                        }
                    }
                }
            });
        })();

        // ── Donut Chart: Status IUCN ───────────────────────────────────
        (function() {
            const iucnLabels = <?php echo json_encode($iucnLabels, 15, 512) ?>;
            const iucnData = <?php echo json_encode($iucnData, 15, 512) ?>;
            const iucnTotal = iucnData.reduce((sum, value) => sum + value, 0);

            const canvasIucn = document.getElementById('pieIucn');
            if (!canvasIucn) return;
            const ctxIucn = canvasIucn.getContext('2d');

            const iucnColorMap = {
                NE: '#22c55e',
                DD: '#3b82f6',
                LC: '#06b6d4',
                NT: '#fb923c',
                VU: '#fbbf24',
                EN: '#ef4444',
                CR: '#e879f9',
                EW: '#0ea5e9',
                EX: '#f472b6',
            };
            const displayLabels = iucnLabels.length > 0 ? iucnLabels : ['Tidak ada data'];
            const displayData = iucnTotal > 0 ? iucnData : displayLabels.map(() => 1);
            const chartColors = displayLabels.map(label => iucnColorMap[label] ?? '#94a3b8');
            const finalColors = chartColors;
 
            new Chart(ctxIucn, {
                type: 'doughnut',
                data: {
                    labels: displayLabels,
                    datasets: [{
                        data: displayData,
                        backgroundColor: finalColors,
                        borderWidth: 3,
                        borderColor: 'transparent',
                        hoverOffset: 6
                    }]
                },
                options: {
                    cutout: '68%',
                    responsive: false,
                    animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: iucnTotal > 0,
                            callbacks: {
                                label: function(ctx) {
                                    const val = ctx.parsed;
                                    const pct = iucnTotal > 0 ? Math.round((val / iucnTotal) * 100) : 0;
                                    return ` ${val} pohon (${pct}%)`;
                                }
                            },
                            backgroundColor: 'rgba(15,23,42,0.85)',
                            padding: 10,
                            cornerRadius: 8,
                            titleFont: { weight: '700' },
                            bodyFont: { size: 13 }
                        }
                    }
                }
            });
        })();
    </script>

</body>
</html><?php /**PATH C:\laragon\www\baru\resources\views/dashboar.blade.php ENDPATH**/ ?>