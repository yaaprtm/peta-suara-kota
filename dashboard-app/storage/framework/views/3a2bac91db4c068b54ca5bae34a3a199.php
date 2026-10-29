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
                    <a href="<?php echo e(route('dashboard.leaderboard')); ?>" class="quick-icon" title="Trophy">
                        <i class="fa-solid fa-trophy"></i>
                    </a>
                    <a href="<?php echo e(route('dashboard.settings')); ?>" class="quick-icon" title="Settings">
                        <i class="fa-solid fa-gear"></i>
                    </a>
                    <a href="<?php echo e(route('dashboard.media')); ?>" class="quick-icon active" title="Folder">
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
<a href="<?php echo e(route('dashboard.logbook-dpki')); ?>" class="menu-item">
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
            
            <!-- Topbar -->
            <header class="top-nav">
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Buka Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="current-date" style="font-weight: 500; color: var(--text-secondary); font-size: 1.05rem;">
                    <i class="fa-regular fa-calendar" style="margin-right: 8px;"></i>
                    <?php echo e(\Carbon\Carbon::now('Asia/Jakarta')->locale('id')->translatedFormat('l, d F Y')); ?>

                </div>
                <div class="top-user-area">
                    <a href="/dashboard" class="btn-primary" style="display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
                        <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
                    </a>
                </div>
            </header>

            <div class="dashboard-header-title">
                <h2>Galeri Media</h2>
                <p>Kompilasi foto/gambar dari seluruh artikel dan laporan masuk.</p>
            </div>

            <!-- Filters & Search bar -->
            <div class="gallery-filter-container">
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="setCategory('all')">Semua</button>
                    <?php if(in_array(auth()->user()->role, ['root', 'm_admin', 'm_user'])): ?>
                        <button class="filter-tab" onclick="setCategory('artikel')">Info Artikel</button>
                    <?php endif; ?>
                    <button class="filter-tab" onclick="setCategory('konservasi')">Laporan Konservasi</button>
                    <button class="filter-tab" onclick="setCategory('kebersihan')">Laporan Non-Konservasi</button>
                    <button class="filter-tab" onclick="setCategory('tree')">Tree (Pohon)</button>
                    <?php if(in_array(auth()->user()->role, ['root', 'd_admin', 'd_user'])): ?>
                        <button class="filter-tab" onclick="setCategory('logbook')">Logbook DPKI</button>
                    <?php endif; ?>
                    <?php if(in_array(auth()->user()->role, ['root', 'm_admin', 'm_user'])): ?>
                        <button class="filter-tab" onclick="setCategory('berita')">Berita</button>
                    <?php endif; ?>
                </div>
                <div class="search-wrapper">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="gallerySearch" class="search-input" placeholder="Cari judul, uploader, atau info..." oninput="handleSearch()">
                </div>
            </div>

            <!-- Gallery Grid -->
            <div class="gallery-grid" id="galleryGrid">
                
                <!-- Info Artikel Media -->
                <?php $__currentLoopData = $artikelMedia; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="gallery-card" data-category="artikel" data-title="<?php echo e(strtolower($item->judul)); ?>" data-user="<?php echo e(strtolower($item->user->nama_user ?? 'unknown')); ?>" data-desc="<?php echo e(strtolower($item->deskripsi)); ?>" onclick="openMediaModal('artikel', <?php echo e(json_encode($item)); ?>)">
                        <div class="card-image-wrapper">
                            <span class="category-badge badge-artikel">Artikel</span>
                            <img src="/<?php echo e($item->gambar_url); ?>" alt="<?php echo e($item->judul); ?>">
                        </div>
                        <div class="card-info">
                            <span class="card-date"><i class="fa-regular fa-clock"></i> <?php echo e($item->created_at->format('d M Y, H:i')); ?></span>
                            <h4 class="card-title"><?php echo e($item->judul); ?></h4>
                            <div class="card-footer">
                                <span class="card-user"><i class="fa-regular fa-user"></i> <?php echo e($item->user->nama_user ?? 'Penulis'); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

                <!-- Laporan Media (Konservasi & Kebersihan) -->
                <?php $__currentLoopData = $laporanMedia; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php $jenisLaporan = $item->jenis_laporan ?? 'konservasi'; ?>
                    <div class="gallery-card" data-category="<?php echo e($jenisLaporan); ?>" data-title="<?php echo e(strtolower($item->judul)); ?>" data-user="<?php echo e(strtolower($item->user->nama_user ?? 'unknown')); ?>" data-desc="<?php echo e(strtolower($item->deskripsi)); ?>" onclick="openMediaModal('<?php echo e($jenisLaporan); ?>', <?php echo e(json_encode($item)); ?>)">
                        <div class="card-image-wrapper">
                            <?php
                                $badgeBg = match(trim(strtolower($jenisLaporan))) {
                                    'konservasi' => 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
                                    'non-konservasi', 'kebersihan' => 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    default => 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                };
                            ?>
                            <span style="position:absolute; top:15px; left:15px; padding:5px 14px; border-radius:99px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#fff; background:<?php echo e($badgeBg); ?>; box-shadow:0 4px 14px rgba(0,0,0,0.25); z-index:2; white-space:nowrap;"><?php echo e(strtoupper($jenisLaporan)); ?></span>
                            <img src="/<?php echo e($item->foto_before ?: $item->foto_after); ?>" alt="<?php echo e($item->judul); ?>">
                        </div>
                        <div class="card-info">
                            <span class="card-date"><i class="fa-regular fa-clock"></i> <?php echo e($item->created_at->format('d M Y, H:i')); ?></span>
                            <h4 class="card-title"><?php echo e($item->judul); ?></h4>
                            <div class="card-footer">
                                <span class="card-user"><i class="fa-regular fa-user"></i> <?php echo e($item->user->nama_user ?? 'Pelapor'); ?></span>
                                <span class="card-status-badge status-<?php echo e(strtolower($item->status->nama_status ?? 'pending')); ?>"><?php echo e($item->status->nama_status ?? 'Pending'); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

                <!-- Tree (Pohon) Media -->
                <?php $__currentLoopData = $treeMedia; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php $treeTitle = $item->nama_lokal ?: $item->nama_jenis ?: 'Pohon Tanpa Nama'; ?>
                    <div class="gallery-card" data-category="tree" data-title="<?php echo e(strtolower($treeTitle)); ?>" data-user="<?php echo e(strtolower($item->collector ?? 'system')); ?>" data-desc="<?php echo e(strtolower($item->desc)); ?>" onclick="openMediaModal('tree', <?php echo e(json_encode($item)); ?>)">
                        <div class="card-image-wrapper">
                            <span class="category-badge badge-tree">Pohon</span>
                            <img src="/<?php echo e($item->image); ?>" alt="<?php echo e($treeTitle); ?>">
                        </div>
                        <div class="card-info">
                            <span class="card-date"><i class="fa-regular fa-clock"></i> <?php echo e($item->created_at ? $item->created_at->format('d M Y, H:i') : ($item->timestamp_create ? $item->timestamp_create->format('d M Y, H:i') : '-')); ?></span>
                            <h4 class="card-title"><?php echo e($treeTitle); ?></h4>
                            <div class="card-footer">
                                <span class="card-user"><i class="fa-solid fa-leaf"></i> <?php echo e($item->collector ?: 'System'); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

                <!-- Logbook DPKI Media -->
                <?php $__currentLoopData = $logbookMedia; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php $logbookTitle = $item->jenis_kegiatan ?: 'Kegiatan DPKI'; ?>
                    <div class="gallery-card" data-category="logbook" data-title="<?php echo e(strtolower($logbookTitle)); ?>" data-user="<?php echo e(strtolower($item->user->nama_user ?? 'unknown')); ?>" data-desc="<?php echo e(strtolower($item->kondisi_tumbuhan)); ?>" onclick="openMediaModal('logbook', <?php echo e(json_encode($item)); ?>)">
                        <div class="card-image-wrapper">
                            <span class="category-badge badge-logbook">Logbook</span>
                            <img src="/<?php echo e($item->dokumentasi_kegiatan_sehat ?: $item->dokumentasi_kegiatan); ?>" alt="<?php echo e($logbookTitle); ?>">
                        </div>
                        <div class="card-info">
                            <span class="card-date"><i class="fa-regular fa-clock"></i> <?php echo e($item->created_at ? $item->created_at->format('d M Y, H:i') : ($item->create_at ? $item->create_at->format('d M Y, H:i') : '-')); ?></span>
                            <h4 class="card-title"><?php echo e($logbookTitle); ?></h4>
                            <div class="card-footer">
                                <span class="card-user"><i class="fa-regular fa-user"></i> <?php echo e($item->user->nama_user ?? '-'); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

                <!-- Berita Media -->
                <?php $__currentLoopData = $beritaMedia; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="gallery-card" data-category="berita" data-title="<?php echo e(strtolower($item->judul)); ?>" data-user="<?php echo e(strtolower($item->penulis ?? ($item->user->nama_user ?? 'unknown'))); ?>" data-desc="<?php echo e(strtolower($item->deskripsi)); ?>" onclick="openMediaModal('berita', <?php echo e(json_encode($item)); ?>)">
                        <div class="card-image-wrapper">
                            <span class="category-badge badge-berita">Berita</span>
                            <img src="/<?php echo e($item->gambar_url); ?>" alt="<?php echo e($item->judul); ?>">
                        </div>
                        <div class="card-info">
                            <span class="card-date"><i class="fa-regular fa-clock"></i> <?php echo e($item->created_at->format('d M Y, H:i')); ?></span>
                            <h4 class="card-title"><?php echo e($item->judul); ?></h4>
                            <div class="card-footer">
                                <span class="card-user"><i class="fa-regular fa-user"></i> <?php echo e($item->penulis ?? ($item->user->nama_user ?? '-')); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

            </div>

        </main>
    </div>

    <!-- Modal View -->
    <div class="media-modal" id="mediaModal" onclick="closeOnOverlay(event)">
        <div class="modal-content-wrapper">
            <button class="modal-close-btn" onclick="closeMediaModal()"><i class="fa-solid fa-xmark"></i></button>
            
            <div class="modal-left">
                <img id="modalImg" class="modal-main-img" src="" alt="View Image">
                <div class="modal-img-tabs" id="modalImgTabs" style="display: none;">
                    <button class="modal-img-tab active" id="tabBefore" onclick="switchModalImage('before')">Foto Sebelum</button>
                    <button class="modal-img-tab" id="tabAfter" onclick="switchModalImage('after')">Foto Sesudah</button>
                </div>
            </div>

            <div class="modal-right">
                <div class="modal-meta-section">
                    <span class="category-badge" id="modalCategoryBadge" style="position: static; display: inline-block; margin-bottom: 12px;">Kategori</span>
                    <h3 class="modal-title" id="modalTitle">Judul Media</h3>
                    <p class="modal-desc" id="modalDesc">Deskripsi lengkap dari data media yang diunggah.</p>
                </div>

                <div style="margin-top: 15px; margin-bottom: 25px;">
                    <div class="detail-row">
                        <span class="detail-label">Pengunggah / Pelapor</span>
                        <span class="detail-value" id="modalUploader">-</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tanggal Unggah</span>
                        <span class="detail-value" id="modalDate">-</span>
                    </div>
                    <div class="detail-row" id="rowStatus">
                        <span class="detail-label">Status Laporan</span>
                        <span class="detail-value" id="modalStatus">-</span>
                    </div>
                    <div class="detail-row" id="rowExtra1">
                        <span class="detail-label" id="extraLabel1">Info Tambahan 1</span>
                        <span class="detail-value" id="extraVal1">-</span>
                    </div>
                    <div class="detail-row" id="rowExtra2">
                        <span class="detail-label" id="extraLabel2">Info Tambahan 2</span>
                        <span class="detail-value" id="extraVal2">-</span>
                    </div>
                    <div class="detail-row" id="rowCoordinates">
                        <span class="detail-label">Koordinat Lokasi</span>
                        <span class="detail-value" id="modalCoordinates">-</span>
                    </div>
                </div>

                <div class="recap-actions">
                    <button class="btn-copy-recap" onclick="copyRecapText()">
                        <i class="fa-regular fa-copy"></i> Salin Info Rekap
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notice -->
    <div class="toast-copy" id="toastCopy">
        <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 1.2rem;"></i>
        <span>Info Rekap berhasil disalin ke clipboard!</span>
    </div>

    <script>
        let currentFilter = 'all';
        let currentSearch = '';
        let activeItemData = null;
        let activeItemCategory = '';
        let currentImgMode = 'before';

        function setCategory(cat) {
            currentFilter = cat;
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            filterGallery();
        }

        function handleSearch() {
            currentSearch = document.getElementById('gallerySearch').value.toLowerCase().trim();
            filterGallery();
        }

        function filterGallery() {
            const cards = document.querySelectorAll('.gallery-card');
            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                const title = card.getAttribute('data-title');
                const user = card.getAttribute('data-user');
                const desc = card.getAttribute('data-desc');

                const matchesCategory = (currentFilter === 'all' || category === currentFilter);
                const matchesSearch = (title.includes(currentSearch) || user.includes(currentSearch) || desc.includes(currentSearch));

                if (matchesCategory && matchesSearch) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        function openMediaModal(category, item) {
            activeItemData = item;
            activeItemCategory = category;
            currentImgMode = 'before';

            // Base fields
            let title = '';
            let desc = '';
            let uploader = '-';
            let mainImage = '';

            if (category === 'artikel') {
                title = item.judul;
                desc = item.deskripsi || 'Tidak ada deskripsi.';
                uploader = item.user ? item.user.nama_user : 'Penulis';
                mainImage = '/' + item.gambar_url;
            } else if (category === 'berita') {
                title = item.judul;
                desc = item.deskripsi || 'Tidak ada deskripsi.';
                uploader = item.penulis || (item.user ? item.user.nama_user : 'Penulis');
                mainImage = '/' + item.gambar_url;
            } else if (category === 'tree') {
                title = item.nama_lokal || item.nama_jenis || 'Pohon Tanpa Nama';
                desc = item.desc || 'Tidak ada deskripsi.';
                uploader = item.collector || 'System';
                mainImage = '/' + item.image;
            } else if (category === 'logbook') {
                title = item.jenis_kegiatan || 'Kegiatan Logbook';
                desc = item.kondisi_tumbuhan || item.kegiatan_lain || 'Tidak ada deskripsi.';
                uploader = item.user ? item.user.nama_user : '-';
                mainImage = '/' + (item.dokumentasi_kegiatan_sehat || item.dokumentasi_kegiatan);
            } else {
                // konservasi or kebersihan
                title = item.judul;
                desc = item.deskripsi || 'Tidak ada deskripsi.';
                uploader = item.user ? item.user.nama_user : 'Pelapor';
                mainImage = '/' + (item.foto_before || item.foto_after);
            }

            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('modalUploader').innerText = uploader;
            
            // Date formatting
            const dateVal = item.created_at || item.create_at || item.published_at || item.timestamp_create;
            let formattedDate = '-';
            if (dateVal) {
                const dateObj = new Date(dateVal);
                formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
            document.getElementById('modalDate').innerText = formattedDate;

            // Reset extra views
            const rowExtra1 = document.getElementById('rowExtra1');
            const rowExtra2 = document.getElementById('rowExtra2');
            const rowCoordinates = document.getElementById('rowCoordinates');
            const rowStatus = document.getElementById('rowStatus');
            const tabs = document.getElementById('modalImgTabs');
            const btnBefore = document.getElementById('tabBefore');
            const btnAfter = document.getElementById('tabAfter');
            
            rowExtra1.style.display = 'none';
            rowExtra2.style.display = 'none';
            rowCoordinates.style.display = 'none';
            rowStatus.style.display = 'none';
            tabs.style.display = 'none';

            // Kategori Badge
            const badge = document.getElementById('modalCategoryBadge');
            badge.className = 'category-badge';
            
            if (category === 'artikel') {
                badge.innerText = 'Artikel';
                badge.classList.add('badge-artikel');
            } else if (category === 'berita') {
                badge.innerText = 'Berita';
                badge.classList.add('badge-berita');
            } else if (category === 'tree') {
                badge.innerText = 'Tree (Pohon)';
                badge.classList.add('badge-tree');

                rowExtra1.style.display = 'flex';
                document.getElementById('extraLabel1').innerText = 'Family';
                document.getElementById('extraVal1').innerText = item.family || '-';

                rowExtra2.style.display = 'flex';
                document.getElementById('extraLabel2').innerText = 'Spesies';
                document.getElementById('extraVal2').innerText = `${item.genus || ''} ${item.species || ''}`.trim() || '-';

                if (item.latitude && item.longitude) {
                    rowCoordinates.style.display = 'flex';
                    document.getElementById('modalCoordinates').innerText = `${item.latitude}, ${item.longitude}`;
                }
            } else if (category === 'logbook') {
                badge.innerText = 'Logbook DPKI';
                badge.classList.add('badge-logbook');

                rowExtra1.style.display = 'flex';
                document.getElementById('extraLabel1').innerText = 'Nama Tumbuhan';
                document.getElementById('extraVal1').innerText = item.nama_tumbuhan || (item.tree ? item.tree.nama_lokal : '-');

                rowExtra2.style.display = 'flex';
                document.getElementById('extraLabel2').innerText = 'Koleksi/Vak';
                document.getElementById('extraVal2').innerText = `${item.vak_koleksi || '-'} / ${item.no_vak || '-'}`;

                if (item.latitude && item.longitude) {
                    rowCoordinates.style.display = 'flex';
                    document.getElementById('modalCoordinates').innerText = `${item.latitude}, ${item.longitude}`;
                }

                // Check double image (dokumentasi_kegiatan_sehat vs dokumentasi_kegiatan)
                if (item.dokumentasi_kegiatan_sehat && item.dokumentasi_kegiatan) {
                    tabs.style.display = 'flex';
                    btnBefore.innerText = 'Foto Sehat';
                    btnAfter.innerText = 'Foto Kegiatan';
                    btnBefore.classList.add('active');
                    btnAfter.classList.remove('active');
                }
            } else {
                // Laporan
                rowStatus.style.display = 'flex';
                document.getElementById('modalStatus').innerText = item.status ? item.status.nama_status : 'Pending';
                
                if (item.latitude && item.longitude) {
                    rowCoordinates.style.display = 'flex';
                    document.getElementById('modalCoordinates').innerText = `${item.latitude}, ${item.longitude}`;
                }

                // Check double image (before / after)
                if (item.foto_before && item.foto_after) {
                    tabs.style.display = 'flex';
                    btnBefore.innerText = 'Foto Sebelum';
                    btnAfter.innerText = 'Foto Sesudah';
                    btnBefore.classList.add('active');
                    btnAfter.classList.remove('active');
                }

                if (category === 'konservasi') {
                    badge.innerText = 'Laporan Konservasi';
                    badge.classList.add('badge-konservasi');

                    rowExtra1.style.display = 'flex';
                    document.getElementById('extraLabel1').innerText = 'Nama Pohon';
                    document.getElementById('extraVal1').innerText = item.nama_pohon || '-';
                } else if (category === 'kebersihan' || category === 'non-konservasi') {
                    badge.innerText = 'Laporan Non-Konservasi';
                    badge.classList.add('badge-non-konservasi');

                    rowExtra1.style.display = 'flex';
                    document.getElementById('extraLabel1').innerText = 'Kategori Kebersihan';
                    document.getElementById('extraVal1').innerText = item.kategori_tingkat ? item.kategori_tingkat.nama_kategori : '-';
                }
            }

            document.getElementById('modalImg').src = mainImage;

            const modal = document.getElementById('mediaModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }

        function closeMediaModal() {
            const modal = document.getElementById('mediaModal');
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }

        function closeOnOverlay(e) {
            if (e.target.id === 'mediaModal') {
                closeMediaModal();
            }
        }

        function switchModalImage(mode) {
            if (!activeItemData) return;
            currentImgMode = mode;
            
            const btnBefore = document.getElementById('tabBefore');
            const btnAfter = document.getElementById('tabAfter');
            
            if (mode === 'before') {
                btnBefore.classList.add('active');
                btnAfter.classList.remove('active');
                if (activeItemCategory === 'logbook') {
                    document.getElementById('modalImg').src = '/' + activeItemData.dokumentasi_kegiatan_sehat;
                } else {
                    document.getElementById('modalImg').src = '/' + activeItemData.foto_before;
                }
            } else {
                btnBefore.classList.remove('active');
                btnAfter.classList.add('active');
                if (activeItemCategory === 'logbook') {
                    document.getElementById('modalImg').src = '/' + activeItemData.dokumentasi_kegiatan;
                } else {
                    document.getElementById('modalImg').src = '/' + activeItemData.foto_after;
                }
            }
        }

        function copyRecapText() {
            if (!activeItemData) return;

            let text = '';
            let categoryName = '';
            if (activeItemCategory === 'artikel') categoryName = 'Info Artikel';
            else if (activeItemCategory === 'berita') categoryName = 'Berita';
            else if (activeItemCategory === 'tree') categoryName = 'Tree (Pohon)';
            else if (activeItemCategory === 'logbook') categoryName = 'Logbook DPKI';
            else if (activeItemCategory === 'konservasi') categoryName = 'Laporan Konservasi';
            else if (activeItemCategory === 'kebersihan') categoryName = 'Laporan Kebersihan';

            const dateVal = activeItemData.created_at || activeItemData.create_at || activeItemData.published_at || activeItemData.timestamp_create;
            let formattedDate = '-';
            if (dateVal) {
                const dateObj = new Date(dateVal);
                formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            text += `[REKAP MEDIA - ${categoryName.toUpperCase()}]\n`;
            
            let title = '';
            let desc = '';
            let uploader = '-';

            if (activeItemCategory === 'artikel') {
                title = activeItemData.judul;
                desc = activeItemData.deskripsi || '-';
                uploader = activeItemData.user ? activeItemData.user.nama_user : '-';
            } else if (activeItemCategory === 'berita') {
                title = activeItemData.judul;
                desc = activeItemData.deskripsi || '-';
                uploader = activeItemData.penulis || (activeItemData.user ? activeItemData.user.nama_user : '-');
            } else if (activeItemCategory === 'tree') {
                title = activeItemData.nama_lokal || activeItemData.nama_jenis || '-';
                desc = activeItemData.desc || '-';
                uploader = activeItemData.collector || '-';
            } else if (activeItemCategory === 'logbook') {
                title = activeItemData.jenis_kegiatan || '-';
                desc = activeItemData.kondisi_tumbuhan || activeItemData.kegiatan_lain || '-';
                uploader = activeItemData.user ? activeItemData.user.nama_user : '-';
            } else {
                title = activeItemData.judul;
                desc = activeItemData.deskripsi || '-';
                uploader = activeItemData.user ? activeItemData.user.nama_user : '-';
            }

            text += `Judul: ${title}\n`;
            text += `Tanggal: ${formattedDate}\n`;
            text += `Uploader/Pelapor/Collector: ${uploader}\n`;
            
            if (activeItemCategory === 'tree') {
                text += `Family: ${activeItemData.family || '-'}\n`;
                text += `Spesies: ${activeItemData.genus || ''} ${activeItemData.species || ''}\n`;
            } else if (activeItemCategory === 'logbook') {
                text += `Nama Tumbuhan: ${activeItemData.nama_tumbuhan || '-'}\n`;
                text += `Koleksi/Vak: ${activeItemData.vak_koleksi || '-'} / ${activeItemData.no_vak || '-'}\n`;
            } else if (activeItemCategory === 'konservasi') {
                text += `Nama Pohon: ${activeItemData.nama_pohon || '-'}\n`;
                text += `Status: ${activeItemData.status ? activeItemData.status.nama_status : 'Pending'}\n`;
            } else if (activeItemCategory === 'kebersihan') {
                text += `Kategori Kebersihan: ${activeItemData.kategori_tingkat ? activeItemData.kategori_tingkat.nama_kategori : '-'}\n`;
                text += `Status: ${activeItemData.status ? activeItemData.status.nama_status : 'Pending'}\n`;
            }

            if (activeItemData.latitude && activeItemData.longitude) {
                text += `Lokasi Koordinat: ${activeItemData.latitude}, ${activeItemData.longitude}\n`;
            }
            
            text += `Deskripsi/Kondisi: ${desc}\n`;

            navigator.clipboard.writeText(text).then(() => {
                showToastFeedback();
            }).catch(err => {
                console.error('Gagal menyalin teks: ', err);
            });
        }

        function showToastFeedback() {
            const toast = document.getElementById('toastCopy');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    </script>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>
</body>
</html>
<?php /**PATH C:\laragon\www\baru\resources\views/media.blade.php ENDPATH**/ ?>