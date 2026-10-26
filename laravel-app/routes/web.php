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

// ─── Direct Reporting Entry ──────────────────────────────────────────────────
Route::get('/lapor', function () {
    return redirect()->route('peta', ['lapor' => 'true']);
})->middleware('auth')->name('reports.create');

// ─── Protected Role-Based Pages ──────────────────────────────────────────────

Route::middleware(['auth', 'role:WARGA'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'role:PETUGAS'])->group(function () {
    Route::get('/petugas', function () {
        return Inertia::render('Petugas/Dashboard');
    })->name('petugas.dashboard');
});

Route::middleware(['auth', 'role:ADMIN,SUPERADMIN'])->group(function () {
    Route::get('/superadmin', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/superadmin/master', function () {
        return Inertia::render('Admin/MasterData');
    })->name('admin.master');
});

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
