<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public Pages ─────────────────────────────────────────────────────────────

Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

Route::get('/peta', function () {
    return Inertia::render('MapPage');
})->name('peta');

Route::get('/leaderboard', function () {
    return Inertia::render('Leaderboard');
})->name('leaderboard');

Route::get('/laporan/{id}', function (string $id) {
    return Inertia::render('Reports/Show', [
        'id' => $id,
    ]);
})->name('reports.show');

// ─── Auth / User Pages ────────────────────────────────────────────────────────

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::get('/petugas', function () {
    return Inertia::render('Petugas/Dashboard');
})->name('petugas.dashboard');

Route::get('/superadmin', function () {
    return Inertia::render('Admin/Dashboard');
})->name('admin.dashboard');

Route::get('/superadmin/master', function () {
    return Inertia::render('Admin/MasterData');
})->name('admin.master');

// ─── Auth Routes ──────────────────────────────────────────────────────────────

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('Auth/Register');
})->name('register');

require __DIR__.'/auth.php';

// ─── Fallback Graceful Route ──────────────────────────────────────────────────
Route::fallback(function () {
    return redirect()->route('landing');
});
