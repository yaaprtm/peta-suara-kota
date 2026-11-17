<?php

namespace App\Providers;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\InMemory\InMemoryCounterRepository;
use App\Repositories\InMemory\InMemoryReportRepository;
use App\Repositories\InMemory\InMemoryTokenRepository;
use App\Repositories\InMemory\InMemoryUserRepository;
use App\Repositories\Static\StaticCategoryRepository;
use App\Repositories\Static\StaticKelurahanRepository;
use App\Services\Firebase\FirestoreClientInterface;
use App\Services\Firebase\FirestoreRestClient;
use Illuminate\Support\ServiceProvider;

class FirebaseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // 1. Client Firestore
        $this->app->singleton(FirestoreClientInterface::class, function () {
            return new FirestoreRestClient();
        });

        // 2. Static Repositories (0 kuota Firestore)
        $this->app->singleton(KelurahanRepositoryInterface::class, StaticKelurahanRepository::class);
        $this->app->singleton(CategoryRepositoryInterface::class, StaticCategoryRepository::class);

        // 3. Entity Repositories
        // Pada Tahap 1, kita daftarkan implementasi InMemory sebagai default atau ketika mode testing / inmemory aktif.
        $driver = config('firebase.driver', 'firestore');

        if ($driver === 'inmemory' || app()->runningUnitTests()) {
            $this->app->singleton(UserRepositoryInterface::class, InMemoryUserRepository::class);
            $this->app->singleton(TokenRepositoryInterface::class, InMemoryTokenRepository::class);
            $this->app->singleton(CounterRepositoryInterface::class, InMemoryCounterRepository::class);
            $this->app->singleton(ReportRepositoryInterface::class, InMemoryReportRepository::class);
        } else {
            // Default Tahap 1 sebelum Firestore repository selesai di Tahap 2
            $this->app->singleton(UserRepositoryInterface::class, InMemoryUserRepository::class);
            $this->app->singleton(TokenRepositoryInterface::class, InMemoryTokenRepository::class);
            $this->app->singleton(CounterRepositoryInterface::class, InMemoryCounterRepository::class);
            $this->app->singleton(ReportRepositoryInterface::class, InMemoryReportRepository::class);
        }
    }

    public function boot(): void
    {
        //
    }
}

