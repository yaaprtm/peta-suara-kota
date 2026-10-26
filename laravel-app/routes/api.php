<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KelurahanController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StatsController;
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
        Route::get('stream', [ReportController::class, 'stream']);
        Route::get('/', [ReportController::class, 'index']);
        Route::get('{id}', [ReportController::class, 'show']);

        // Protected report actions
        Route::middleware(['auth'])->group(function () {
            Route::post('/', [ReportController::class, 'store'])->middleware('throttle:10,1');
            Route::patch('{id}/status', [ReportController::class, 'updateStatus']);
            Route::delete('{id}', [ReportController::class, 'destroy']);
        });
    });

    // Kelurahans endpoints
    Route::prefix('kelurahans')->group(function () {
        Route::get('/', [KelurahanController::class, 'index']);
        Route::get('{id}', [KelurahanController::class, 'show']);
    });

    // Stats endpoints
    Route::prefix('stats')->group(function () {
        Route::get('overview', [StatsController::class, 'overview']);
        Route::get('leaderboard', [StatsController::class, 'leaderboard']);
    });
});
