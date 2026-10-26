<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Peta Suara Kota Surabaya — Command Center Pelaporan Masalah & Aspirasi Warga Surabaya. Laporkan masalah infrastruktur, kebersihan, banjir, dan keamanan di Kota Surabaya.">
        <meta name="theme-color" content="#0f172a">
        <meta name="author" content="Tim Workshop Peta Suara Kota — Universitas Surabaya">

        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="Peta Suara Kota Surabaya">
        <meta property="og:description" content="Command Center Pelaporan Masalah & Aspirasi Warga Kota Surabaya. Pantau, laporkan, dan tindak lanjuti permasalahan kota secara real-time.">
        <meta property="og:site_name" content="Peta Suara Kota Surabaya">
        <meta property="og:locale" content="id_ID">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Peta Suara Kota Surabaya">
        <meta name="twitter:description" content="Command Center Pelaporan Masalah & Aspirasi Warga Kota Surabaya.">

        <title inertia>{{ config('app.name', 'Peta Suara Kota Surabaya') }}</title>

        <!-- Google Fonts: Inter, Fraunces, Courier Prime, Caveat -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        <!-- Leaflet & Mapbox GL CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.31.0/mapbox-gl.css" />

        <!-- Scripts -->
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased text-ink bg-white">
        @inertia
    </body>
</html>
