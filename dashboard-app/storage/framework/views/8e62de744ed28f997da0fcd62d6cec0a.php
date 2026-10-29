<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kebun Raya Cibinong</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>" />
  </head>
  <body>
    <!-- HERO + VIDEO -->
    <header class="hero-video">
      <div class="hero-video-bg">
        <video autoplay muted loop playsinline>
          <source src="<?php echo e(asset('videoplayback.mp4')); ?>" type="video/mp4" />
        </video>
        <div class="hero-overlay"></div>
      </div>

      <!-- NAVBAR -->
      <nav class="taskbar taskbar-overlay" id="mainNav">
        <div class="taskbar-inner">
          <a href="<?php echo e(url('/')); ?>" class="brand brand-swap">
            <img
              src="<?php echo e(asset('Logo Baju KRC copy.png')); ?>"
              alt="Logo Kebun Raya Cibinong"
              class="brand-logo brand-logo-light"
            />
            <img
              src="<?php echo e(asset('Logo Baju KRC.png')); ?>"
              alt="Logo Kebun Raya Cibinong"
              class="brand-logo brand-logo-dark"
            />
          </a>

          <ul class="nav-links" id="navLinks">
            <li><a href="<?php echo e(url('/#tentang')); ?>">Tentang Kami</a></li>

            <!-- BIOREGION DROPDOWN -->
            <li class="nav-dropdown">
              <button class="nav-dropdown-trigger" id="bioregionTrigger">
                Bioregion
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
                  <path
                    d="M1 1L5.5 5.5L10 1"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <div class="nav-dropdown-panel" id="bioregionPanel">
                <a href="<?php echo e(route('bioregion', 'jawa-bali-1')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Jawa – Bali I</span>
                  <span class="ndi-sub">Kebun Raya Bogor & sekitar</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'jawa-bali-2')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Jawa – Bali II</span>
                  <span class="ndi-sub">Kebun Raya Cibinong</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'jawa-bali-3')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Jawa – Bali III</span>
                  <span class="ndi-sub">Kebun Raya Purwodadi</span>
                </a>
                <div class="dropdown-divider"></div>
                <a href="<?php echo e(route('bioregion', 'maluku')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Maluku</span>
                  <span class="ndi-sub">Kawasan kepulauan timur</span>
                </a>
                <a
                  href="<?php echo e(route('bioregion', 'nusa-tenggara')); ?>"
                  class="nav-dropdown-item"
                >
                  <span class="ndi-title">Nusa Tenggara</span>
                  <span class="ndi-sub">Kawasan kepulauan selatan</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'papua')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Papua</span>
                  <span class="ndi-sub">Hutan tropis terluas</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'kalimantan')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Kalimantan</span>
                  <span class="ndi-sub">Borneo biodiversity</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'sulawesi')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Sulawesi</span>
                  <span class="ndi-sub">Wallacea endemik</span>
                </a>
                <a href="<?php echo e(route('bioregion', 'sumatera')); ?>" class="nav-dropdown-item">
                  <span class="ndi-title">Sumatera</span>
                  <span class="ndi-sub">Hutan hujan ekuatorial</span>
                </a>
              </div>
            </li>

            <li><a href="<?php echo e(url('/#galeri')); ?>">Galeri</a></li>
            <li><a href="<?php echo e(url('/#posts')); ?>">Berita</a></li>
            <li>
              <a href="<?php echo e(route('konservasi')); ?>" class="nav-konservasi">Konservasi</a>
            </li>
          </ul>

          <div class="nav-actions">
            <a href="<?php echo e(route('harga-tiket')); ?>" class="btn btn-ticket">Harga Tiket</a>
            <?php if(auth()->guard()->check()): ?>
              <a href="<?php echo e(url('/dashboard')); ?>" class="btn btn-masuk">Dashboard</a>
            <?php else: ?>
              <a href="<?php echo e(url('/login')); ?>" class="btn btn-masuk">Masuk</a>
            <?php endif; ?>
            <button class="menu-toggle" id="menuToggle">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <!-- HERO CONTENT -->
      <div class="hero-video-content wrap">
        <span class="eyebrow eyebrow-light">KEBUN RAYA CIBINONG</span>
        <h1 class="hero-light">
          Nikmati suasana alam yang tenang
          <em>dan menyegarkan</em>
          bersama keluarga.
        </h1>
        <p class="lead lead-light">
          Destinasi wisata hijau modern untuk edukasi, relaksasi, penelitian,
          dan pengalaman alam terbaik di tengah kota.
        </p>
        <div class="hero-search">
          <div class="search-bar">
            <svg
              class="search-icon"
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                cx="9"
                cy="9"
                r="7"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M14.5 14.5L18 18"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari Macam Fasilitas... "
              id="searchInput"
            />
            <button class="btn btn-primary search-btn">Cari</button>
          </div>
        </div>
      </div>
    </header>

    <!-- POSTS / BERITA -->
    <section class="section" id="posts">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Berita Terbaru</span>
          <h2>Update dari Kebun Raya Cibinong.</h2>
        </div>
        <div class="posts-grid">
          <article class="post-card">
            <div class="post-thumb">
              <img
                src="https://via.placeholder.com/600x360?text=Berita+1"
                alt="Berita 1"
              />
            </div>
            <div class="post-body">
              <span class="post-date">25 Jun 2026</span>
              <h3>Festival Tanaman Hias 2026 Resmi Dibuka</h3>
              <p>
                Ribuan pengunjung memadati area utama Kebun Raya Cibinong dalam
                acara tahunan festival tanaman hias yang spektakuler.
              </p>
            </div>
          </article>
          <article class="post-card">
            <div class="post-thumb">
              <img
                src="https://via.placeholder.com/600x360?text=Berita+2"
                alt="Berita 2"
              />
            </div>
            <div class="post-body">
              <span class="post-date">18 Jun 2026</span>
              <h3>Program Edukasi Alam untuk Pelajar SD–SMA</h3>
              <p>
                Kebun Raya Cibinong meluncurkan program kunjungan edukasi khusus
                bagi sekolah-sekolah di wilayah Jabodetabek.
              </p>
            </div>
          </article>
          <article class="post-card">
            <div class="post-thumb">
              <img
                src="https://via.placeholder.com/600x360?text=Berita+3"
                alt="Berita 3"
              />
            </div>
            <div class="post-body">
              <span class="post-date">10 Jun 2026</span>
              <h3>Jalur Trekking Baru Dibuka di Area Barat</h3>
              <p>
                Pengunjung kini bisa menikmati jalur trekking sepanjang 2 km
                melalui kawasan hutan konservasi yang baru dibuka.
              </p>
            </div>
          </article>
          <article class="post-card">
            <div class="post-thumb">
              <img
                src="https://via.placeholder.com/600x360?text=Berita+4"
                alt="Berita 4"
              />
            </div>
            <div class="post-body">
              <span class="post-date">2 Jun 2026</span>
              <h3>Koleksi Anggrek Terbaru Tiba dari Kalimantan</h3>
              <p>
                Ratusan spesies anggrek langka asal Kalimantan kini dapat
                dinikmati di rumah kaca pusat koleksi tanaman.
              </p>
            </div>
          </article>
        </div>
        <div class="posts-footer">
          <a href="#" class="btn btn-primary">Lihat Semua Berita →</a>
        </div>
      </div>
    </section>

    <!-- GALERI -->
    <section class="section" id="galeri">
      <div class="wrap">
        <div class="section-head center">
          <span class="eyebrow">Galeri</span>
          <h2>Suasana terbaik Kebun Raya Cibinong.</h2>
        </div>
        <div class="collage">
          <div class="collage-item ci-1">
            <img src="https://via.placeholder.com/600x800" alt="Foto 1" />
          </div>
          <div class="collage-item ci-2">
            <img src="https://via.placeholder.com/600x600" alt="Foto 2" />
          </div>
          <div class="collage-item ci-3">
            <img src="https://via.placeholder.com/600x600" alt="Foto 3" />
          </div>
          <div class="collage-item ci-4">
            <img src="https://via.placeholder.com/600x600" alt="Foto 4" />
          </div>
          <div class="collage-item ci-5">
            <img src="https://via.placeholder.com/600x800" alt="Foto 5" />
          </div>
          <div class="collage-item ci-6">
            <img src="https://via.placeholder.com/600x600" alt="Foto 6" />
          </div>
        </div>
        <div class="galeri-footer">
          <a href="#" class="btn btn-primary">Lihat Semua Foto →</a>
        </div>
      </div>
    </section>

    <!-- TENTANG -->
    <section class="section tentang-section" id="tentang">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Tentang Kami</span>
          <h2>Kebun Raya Cibinong</h2>
        </div>
        <div class="tentang-box">
          <p>
            Kebun Raya Cibinong merupakan kawasan wisata, edukasi, dan
            konservasi tumbuhan yang menghadirkan pengalaman alam modern dengan
            suasana hijau yang nyaman.
          </p>
          <p>
            Tempat ini dirancang sebagai area rekreasi keluarga, penelitian, dan
            pembelajaran lingkungan hidup.
          </p>
        </div>

        <div class="profil-footer">
          <a href="<?php echo e(route('tentang-kami')); ?>" class="btn btn-primary">Lihat Profil Perusahaan →</a>
        </div>
      </div>
    </section>

    <!-- MAP -->
    <section class="section map-section" id="map">
      <div class="wrap">
        <div class="section-head center">
          <span class="eyebrow">Lokasi</span>
          <h2>Temukan Kami</h2>
        </div>
        <div class="map-frame">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d22424.84070049499!2d106.83133888657764!3d-6.4977112154030126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c1a220710f33%3A0xb478d9674a400f39!2sBRIN%20Cibinong!5e0!3m2!1sid!2sid!4v1782859566289!5m2!1sid!2sid"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            title="Lokasi Kebun Raya Cibinong"
          ></iframe>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer id="footer">
      <div class="wrap">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="#" class="brand brand-footer">
              <span class="mark"></span>
              Kebun Raya Cibinong
            </a>
            <p class="footer-tagline">Wisata Alam Modern Indonesia</p>
          </div>
          <div class="footer-social">
            <p class="footer-social-label">Ikuti Kami</p>
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Instagram">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                Instagram
              </a>
              <a href="#" class="social-link" aria-label="YouTube">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"
                  />
                  <polygon
                    points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                YouTube
              </a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Kebun Raya Cibinong. Semua hak dilindungi.</span>
        </div>
      </div>
    </footer>

    <script>
      const menuToggle = document.getElementById("menuToggle");
      const navLinks = document.getElementById("navLinks");
      menuToggle.addEventListener("click", () =>
        navLinks.classList.toggle("open"),
      );
      navLinks
        .querySelectorAll("a")
        .forEach((a) =>
          a.addEventListener("click", () => navLinks.classList.remove("open")),
        );

      // Bioregion dropdown
      const bioregionTrigger = document.getElementById("bioregionTrigger");
      const bioregionPanel = document.getElementById("bioregionPanel");
      bioregionTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        bioregionPanel.classList.toggle("open");
        bioregionTrigger.classList.toggle("open");
      });
      document.addEventListener("click", (e) => {
        if (
          !bioregionPanel.contains(e.target) &&
          e.target !== bioregionTrigger
        ) {
          bioregionPanel.classList.remove("open");
          bioregionTrigger.classList.remove("open");
        }
      });

      // Navbar solid on scroll
      const taskbar = document.querySelector(".taskbar-overlay");
      const heroVideo = document.querySelector(".hero-video");
      window.addEventListener("scroll", () => {
        taskbar.classList.toggle(
          "scrolled",
          window.scrollY > heroVideo.offsetHeight - 80,
        );
      });
    </script>
  </body>
</html><?php /**PATH C:\laragon\www\baru\resources\views/home.blade.php ENDPATH**/ ?>