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
        .badge-published {
            background-color: #d1fae5; color: #065f46;
            padding: 4px 8px; border-radius: 6px;
            font-size: 0.75rem; font-weight: 600;
        }
        .badge-draft {
            background-color: #f3f4f6; color: #374151;
            padding: 4px 8px; border-radius: 6px;
            font-size: 0.75rem; font-weight: 600;
        }
        .penulis-badge {
            display: inline-flex; align-items: center; gap: 5px;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            color: #1d4ed8; border: 1px solid #bfdbfe;
            border-radius: 20px; font-size: 0.72rem; font-weight: 600;
            padding: 3px 10px;
        }
        .image-preview-box {
            width: 100%; height: 180px;
            border: 2px dashed var(--border-color);
            border-radius: 8px; display: flex;
            align-items: center; justify-content: center;
            overflow: hidden; margin-top: 8px;
            background: #f8fafc; position: relative;
        }
        .image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .image-preview-box .placeholder-text {
            color: var(--text-secondary); font-size: 0.85rem; text-align: center;
        }
        .checkbox-container {
            display: flex; align-items: center; gap: 8px;
            cursor: pointer; user-select: none; margin-top: 10px;
        }
        .checkbox-container input { cursor: pointer; width: 18px; height: 18px; }
        .checkbox-container span { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
        .berita-thumb {
            width: 80px; height: 50px; object-fit: cover;
            border-radius: 6px; border: 1px solid var(--border-color);
        }
        .berita-thumb-placeholder {
            width: 80px; height: 50px; border-radius: 6px;
            background: #f1f5f9; display: flex;
            align-items: center; justify-content: center;
            border: 1px solid var(--border-color);
        }
    </style>
</head>
<body>
<div class="dashboard-container">

    <!-- ═══════════ SIDEBAR ═══════════ -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="logo-container">
                <img src="/logo-kebun-raya.png" alt="Kebun Raya Cibinong" class="sidebar-logo">
            </div>
        </div>

        <div class="quick-links">
            <p class="quick-links-title">Quick Links</p>
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
            <p class="menu-category">Main Menu</p>
            <a href="/dashboard" class="menu-item">
                <span class="menu-item-left"><i class="fa-solid fa-chart-pie"></i> Overview</span>
            </a>
            <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-info-artikel')): ?>
            <a href="<?php echo e(route('dashboard.artikel')); ?>" class="menu-item <?php echo e(Request::is('dashboard/artikel*') ? 'active' : ''); ?>">
                <span class="menu-item-left"><i class="fa-solid fa-newspaper"></i> Info Artikel</span>
            </a>
            <?php endif; ?>
            <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('read-laporan')): ?>
<a href="/dashboard/laporan" class="menu-item">
                <span class="menu-item-left"><i class="fa-solid fa-file-invoice"></i> Laporan</span>
                <div style="display:flex;gap:4px;">
                    <?php if($pending > 0): ?> <span class="menu-badge" style="background-color:#f97316;"><?php echo e($pending); ?></span> <?php endif; ?>
                    <?php if($diproses > 0): ?> <span class="menu-badge" style="background-color:#3b82f6;"><?php echo e($diproses); ?></span> <?php endif; ?>
                    <?php if($selesai > 0): ?> <span class="menu-badge" style="background-color:#10b981;"><?php echo e($selesai); ?></span> <?php endif; ?>
                    <?php if($ditolak > 0): ?> <span class="menu-badge" style="background-color:#ef4444;"><?php echo e($ditolak); ?></span> <?php endif; ?>
                    <?php if($pending==0 && $diproses==0 && $selesai==0 && $ditolak==0): ?>
                        <span class="menu-badge" style="background-color:#94a3b8;">0</span>
                    <?php endif; ?>
                </div>
            </a>
<?php endif; ?>
            <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('manage-users')): ?>
            <a href="<?php echo e(route('dashboard.pengguna')); ?>" class="menu-item <?php echo e(Request::is('dashboard/pengguna*') ? 'active' : ''); ?>">
                <span class="menu-item-left"><i class="fa-solid fa-users"></i> Pengguna</span>
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
<a href="<?php echo e(route('dashboard.berita')); ?>" class="menu-item active">
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
            <form action="/logout" method="POST" style="margin:0;padding:0;">
                <?php echo csrf_field(); ?>
                <button type="submit" class="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Keluar</button>
            </form>
        </div>
    </aside>
    <div class="sidebar-resizer"></div>

    <!-- ═══════════ MAIN CONTENT ═══════════ -->
    <main class="main-content">

        <!-- Topbar -->
        <header class="top-nav">
            <form action="<?php echo e(route('dashboard.berita')); ?>" method="GET" class="search-box">
                <input type="text" name="search" placeholder="Cari berita..." value="<?php echo e(request('search')); ?>">
                <button type="submit" class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
            </form>
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

        <!-- Page Header -->
        <div class="reports-header-row">
            <div>
                <h2 style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">Manajemen Berita</h2>
                <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:2px;">Kelola berita dan informasi terkini Kebun Raya Cibinong</p>
            </div>
            <div class="reports-actions">
                <button class="btn-primary" onclick="openCreateModal()">
                    <i class="fa-solid fa-plus"></i> Tambah Berita
                </button>
            </div>
        </div>

        <!-- Flash Success -->
        <?php if(session('success')): ?>
            <div class="alert-success">
                <i class="fa-solid fa-circle-check"></i> <?php echo e(session('success')); ?>

            </div>
        <?php endif; ?>

        <!-- Flash Errors -->
        <?php if(isset($errors) && $errors->any()): ?>
            <div style="background:#fde8e8;border:1px solid #f98080;color:#9b1c1c;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:0.9rem;">
                <ul style="margin:0;padding-left:20px;">
                    <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?> <li><?php echo e($error); ?></li> <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </ul>
            </div>
        <?php endif; ?>

        <!-- Table Card -->
        <div class="reports-summary-card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <h3 style="margin:0;">Daftar Berita</h3>
                <form action="<?php echo e(route('dashboard.berita')); ?>" method="GET" style="display:flex;gap:8px;align-items:center;margin:0;">
                    <?php if(request()->has('search')): ?>
                        <input type="hidden" name="search" value="<?php echo e(request('search')); ?>">
                    <?php endif; ?>
                    <label style="font-size:0.85rem;color:var(--text-secondary);font-weight:500;">Filter:</label>
                    <select name="status" onchange="this.form.submit()"
                            style="padding:6px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:0.85rem;outline:none;background:#fff;cursor:pointer;color:var(--text-primary);font-family:'Outfit',sans-serif;">
                        <option value="">Semua Status</option>
                        <option value="published" <?php echo e(request('status')=='published'?'selected':''); ?>>Publikasi</option>
                        <option value="draft" <?php echo e(request('status')=='draft'?'selected':''); ?>>Draf</option>
                    </select>
                </form>
            </div>
            <div style="overflow-x:auto;margin-top:16px;">
                <table class="summary-table berita-table">
                    <thead>
                        <tr>
                            <th>Gambar</th>
                            <th>Judul / Deskripsi</th>
                            <th>Penulis</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                            <th style="text-align:right;padding-right:0;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php $__empty_1 = true; $__currentLoopData = $beritaList; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $berita): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr>
                            <td style="width:100px;vertical-align:middle;">
                                <?php if($berita->gambar_url): ?>
                                    <a href="/<?php echo e($berita->gambar_url); ?>" target="_blank">
                                        <img src="/<?php echo e($berita->gambar_url); ?>" alt="<?php echo e($berita->judul); ?>" class="berita-thumb">
                                    </a>
                                <?php else: ?>
                                    <div class="berita-thumb-placeholder">
                                        <i class="fa-regular fa-image" style="color:#94a3b8;font-size:1.1rem;"></i>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td style="vertical-align:top;max-width:320px;">
                                <span style="display:block;font-weight:600;font-size:0.95rem;color:var(--text-primary);margin-bottom:4px;"><?php echo e($berita->judul); ?></span>
                                <span style="font-size:0.83rem;color:var(--text-secondary);display:block;line-height:1.4;"><?php echo e(Str::limit($berita->deskripsi, 120)); ?></span>
                                <span style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-top:5px;">
                                    <i class="fa-regular fa-clock" style="margin-right:3px;"></i><?php echo e($berita->created_at->format('d M Y, H:i')); ?>

                                </span>
                            </td>
                            <td style="vertical-align:middle;">
                                <span class="penulis-badge"><i class="fa-solid fa-pen-nib"></i> <?php echo e($berita->penulis); ?></span>
                            </td>
                            <td style="vertical-align:middle;">
                                <?php if($berita->is_published): ?>
                                    <span class="badge-published"><i class="fa-solid fa-circle-check"></i> Publikasi</span>
                                <?php else: ?>
                                    <span class="badge-draft"><i class="fa-solid fa-file-signature"></i> Draf</span>
                                <?php endif; ?>
                            </td>
                            <td style="vertical-align:middle;font-size:0.85rem;color:var(--text-secondary);">
                                <?php echo e($berita->published_at ? $berita->published_at->format('d M Y, H:i') : '-'); ?>

                            </td>
                            <td style="vertical-align:middle;text-align:right;">
                                <div class="btn-action-group" style="justify-content:flex-end;flex-wrap:nowrap;">
                                    <button class="btn-edit" onclick="openEditModal(
                                        '<?php echo e($berita->id_berita); ?>',
                                        '<?php echo e(addslashes($berita->judul)); ?>',
                                        '<?php echo e(addslashes($berita->deskripsi)); ?>',
                                        '<?php echo e(addslashes($berita->penulis)); ?>',
                                        <?php echo e($berita->is_published ? 1 : 0); ?>,
                                        '<?php echo e($berita->gambar_url ? '/' . $berita->gambar_url : ''); ?>'
                                    )">
                                        <i class="fa-solid fa-pen-to-square"></i> Update
                                    </button>
                                    <form action="/dashboard/berita/<?php echo e($berita->id_berita); ?>" method="POST"
                                          onsubmit="return confirm('Hapus berita ini?');" style="display:inline;">
                                        <?php echo csrf_field(); ?>
                                        <?php echo method_field('DELETE'); ?>
                                        <button type="submit" class="btn-delete">
                                            <i class="fa-solid fa-trash-can"></i> Delete
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr>
                            <td colspan="6" style="text-align:center;padding:48px;color:var(--text-secondary);">
                                <i class="fa-regular fa-folder-open" style="font-size:2rem;display:block;margin-bottom:10px;opacity:0.4;"></i>
                                Belum ada berita yang dibuat.
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </main>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- MODAL: TAMBAH BERITA                        -->
<!-- ═══════════════════════════════════════════ -->
<div class="modal-overlay" id="createBeritaModal" style="padding:24px 0;box-sizing:border-box;">
    <div class="modal-container" style="max-width:600px;width:min(600px,calc(100% - 40px));margin:24px auto;box-sizing:border-box;display:flex;flex-direction:column;max-height:calc(100vh - 48px);overflow:hidden;">
        <div class="modal-header">
            <h3><i class="fa-solid fa-bullhorn"></i>&nbsp; Tambah Berita Baru</h3>
            <button class="modal-close" onclick="closeModal('createBeritaModal')">&times;</button>
        </div>
        <form action="<?php echo e(route('berita.store')); ?>" method="POST" enctype="multipart/form-data">
            <?php echo csrf_field(); ?>
            <div class="modal-body" style="overflow:auto;flex:1 1 auto;padding:20px;min-height:0;">
                <div class="form-grid" style="grid-template-columns:1fr;">

                    <!-- Judul -->
                    <div class="form-group form-full">
                        <label for="c_judul">Judul Berita <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="c_judul" name="judul" class="form-control"
                               placeholder="Contoh: Penemuan Spesies Baru di Kebun Raya Cibinong" required>
                    </div>

                    <!-- Upload Gambar -->
                    <div class="form-group form-full">
                        <label for="c_gambar">Upload Gambar <span style="font-weight:normal;font-size:0.8rem;color:var(--text-secondary);">(opsional)</span></label>
                        <input type="file" id="c_gambar" name="gambar_url" class="form-control"
                               accept="image/*" onchange="previewImage(this,'c_preview_img','c_preview_placeholder')">
                        <div class="image-preview-box" id="c_preview_box">
                            <img src="" id="c_preview_img" style="display:none;">
                            <div class="placeholder-text" id="c_preview_placeholder">
                                <i class="fa-regular fa-image" style="font-size:2rem;display:block;margin-bottom:6px;opacity:0.5;"></i>
                                Pilih gambar untuk melihat preview
                            </div>
                        </div>
                    </div>

                    <!-- Deskripsi -->
                    <div class="form-group form-full">
                        <label for="c_deskripsi">Deskripsi <span style="color:#ef4444;">*</span></label>
                        <textarea id="c_deskripsi" name="deskripsi" class="form-control"
                                  placeholder="Tuliskan isi berita di sini..."
                                  style="min-height:120px;" required></textarea>
                    </div>

                    <!-- Penulis -->
                    <div class="form-group form-full">
                        <label for="c_penulis">Penulis <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="c_penulis" name="penulis" class="form-control"
                               placeholder="Nama penulis berita" required>
                    </div>

                    <!-- Publikasi -->
                    <div class="form-group form-full">
                        <label class="checkbox-container">
                            <input type="checkbox" name="is_published" value="1">
                            <span>Langsung Publikasikan Berita</span>
                        </label>
                    </div>

                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('createBeritaModal')">Batal</button>
                <button type="submit" class="btn-primary"><i class="fa-solid fa-paper-plane"></i> Simpan Berita</button>
            </div>
        </form>
    </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- MODAL: EDIT BERITA                          -->
<!-- ═══════════════════════════════════════════ -->
<div class="modal-overlay" id="editBeritaModal" style="padding:24px 0;box-sizing:border-box;">
    <div class="modal-container" style="max-width:600px;width:min(600px,calc(100% - 40px));margin:24px auto;box-sizing:border-box;display:flex;flex-direction:column;max-height:calc(100vh - 48px);overflow:hidden;">
        <div class="modal-header">
            <h3><i class="fa-solid fa-pen-to-square"></i>&nbsp; Update Berita</h3>
            <button class="modal-close" onclick="closeModal('editBeritaModal')">&times;</button>
        </div>
        <form action="" method="POST" id="editBeritaForm" enctype="multipart/form-data">
            <?php echo csrf_field(); ?>
            <?php echo method_field('PUT'); ?>
            <div class="modal-body" style="overflow:auto;flex:1 1 auto;padding:20px;">
                <div class="form-grid" style="grid-template-columns:1fr;">

                    <!-- Judul -->
                    <div class="form-group form-full">
                        <label for="e_judul">Judul Berita <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="e_judul" name="judul" class="form-control" required>
                    </div>

                    <!-- Upload Gambar -->
                    <div class="form-group form-full">
                        <label for="e_gambar">Upload Gambar <span style="font-weight:normal;font-size:0.8rem;color:var(--text-secondary);">(Biarkan kosong jika tidak ingin mengubah)</span></label>
                        <input type="file" id="e_gambar" name="gambar_url" class="form-control"
                               accept="image/*" onchange="previewImage(this,'e_preview_img','e_preview_placeholder')">
                        <div class="image-preview-box" id="e_preview_box">
                            <img src="" id="e_preview_img" style="display:none;">
                            <div class="placeholder-text" id="e_preview_placeholder" style="display:none;">
                                <i class="fa-regular fa-image" style="font-size:2rem;display:block;margin-bottom:6px;opacity:0.5;"></i>
                                Pilih gambar untuk melihat preview
                            </div>
                        </div>
                    </div>

                    <!-- Deskripsi -->
                    <div class="form-group form-full">
                        <label for="e_deskripsi">Deskripsi <span style="color:#ef4444;">*</span></label>
                        <textarea id="e_deskripsi" name="deskripsi" class="form-control" style="min-height:120px;" required></textarea>
                    </div>

                    <!-- Penulis -->
                    <div class="form-group form-full">
                        <label for="e_penulis">Penulis <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="e_penulis" name="penulis" class="form-control" required>
                    </div>

                    <!-- Publikasi -->
                    <div class="form-group form-full">
                        <label class="checkbox-container">
                            <input type="checkbox" name="is_published" id="e_published" value="1">
                            <span>Publikasikan Berita</span>
                        </label>
                    </div>

                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('editBeritaModal')">Batal</button>
                <button type="submit" class="btn-primary"><i class="fa-solid fa-floppy-disk"></i> Update Berita</button>
            </div>
        </form>
    </div>
</div>

<script>
    function openCreateModal() {
        document.getElementById('c_preview_img').src = '';
        document.getElementById('c_preview_img').style.display = 'none';
        document.getElementById('c_preview_placeholder').style.display = 'block';
        document.getElementById('c_judul').value = '';
        document.getElementById('c_deskripsi').value = '';
        document.getElementById('c_penulis').value = '';
        document.getElementById('c_gambar').value = '';
        document.getElementById('createBeritaModal').classList.add('active');
    }

    function openEditModal(id, judul, deskripsi, penulis, isPublished, gambarUrl) {
        const form = document.getElementById('editBeritaForm');
        form.action = '/dashboard/berita/' + id;

        document.getElementById('e_judul').value = judul;
        document.getElementById('e_deskripsi').value = deskripsi;
        document.getElementById('e_penulis').value = penulis;
        document.getElementById('e_published').checked = (isPublished === 1);
        document.getElementById('e_gambar').value = '';

        const previewImg  = document.getElementById('e_preview_img');
        const placeholder = document.getElementById('e_preview_placeholder');
        if (gambarUrl) {
            previewImg.src           = gambarUrl;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            previewImg.src            = '';
            previewImg.style.display  = 'none';
            placeholder.style.display = 'block';
        }
        document.getElementById('editBeritaModal').classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    function previewImage(input, previewId, placeholderId) {
        if (input.files && input.files[0]) {
            const preview     = document.getElementById(previewId);
            const placeholder = document.getElementById(placeholderId);
            const reader      = new FileReader();
            reader.onload = function(e) {
                preview.src           = e.target.result;
                preview.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    });

    const alertEl = document.querySelector('.alert-success');
    if (alertEl) {
        setTimeout(() => {
            alertEl.style.transition = 'opacity 0.5s ease';
            alertEl.style.opacity    = '0';
            setTimeout(() => alertEl.remove(), 500);
        }, 5000);
    }
</script>
</body>
</html>
<?php /**PATH C:\laragon\www\baru\resources\views/berita.blade.php ENDPATH**/ ?>