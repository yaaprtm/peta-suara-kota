<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KelurahanController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->group(function () {
    // Auth endpoints
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });

    // Reports endpoints
    Route::prefix('reports')->group(function () {
        Route::get('viewport', [ReportController::class, 'viewport']);
        Route::get('nearby', [ReportController::class, 'nearby']); // GIS: laporan terdekat (Haversine)
        Route::get('stream', [ReportController::class, 'stream']);
        
        // Export requires ADMIN or SUPERADMIN
        Route::get('export', [ReportController::class, 'export'])
            ->middleware(['token.auth', 'role:ADMIN,SUPERADMIN']);

        Route::get('track/{code}', [ReportController::class, 'track']);
        Route::post('{id}/upvote', [ReportController::class, 'upvote']);
        Route::get('/', [ReportController::class, 'index']);
        Route::get('{id}', [ReportController::class, 'show']);

        // Protected report actions
        Route::middleware(['token.auth'])->group(function () {
            Route::post('/', [ReportController::class, 'store'])->middleware('throttle:10,1');
            Route::get('{id}/status/transitions', [ReportController::class, 'getValidTransitions']);
            Route::patch('{id}/status', [ReportController::class, 'updateStatus'])
                ->middleware('role:PETUGAS,ADMIN,SUPERADMIN');
            Route::delete('{id}', [ReportController::class, 'destroy']);
        });
    });

    // Kelurahans endpoints
    Route::prefix('kelurahans')->group(function () {
        Route::get('geo/bounds', [KelurahanController::class, 'geoBounds']);
        Route::get('/', [KelurahanController::class, 'index']);
        Route::get('{id}', [KelurahanController::class, 'show']);
    });

    // Stats endpoints
    Route::prefix('stats')->group(function () {
        Route::get('overview', [StatsController::class, 'overview']);
        Route::get('leaderboard', [StatsController::class, 'leaderboard']);
        Route::get('kecamatan-density', [StatsController::class, 'kecamatanDensity']); // GIS: choropleth
    });

    // User management endpoints (ADMIN/SUPERADMIN only)
    Route::middleware(['token.auth', 'role:ADMIN,SUPERADMIN'])->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::patch('{id}/role', [UserController::class, 'updateRole']);
        Route::patch('{id}/toggle-active', [UserController::class, 'toggleActive']);
    });
});
