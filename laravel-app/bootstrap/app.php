<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->alias([
            'role'      => \App\Http\Middleware\EnsureUserHasRole::class,
            'token.auth' => \App\Http\Middleware\AuthenticateWithToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            if (!app()->bound('view')) {
                return response(
                    "SERVER ERROR (Pre-boot):\n" . get_class($e) . ': ' . $e->getMessage() . "\n\n" . $e->getFile() . ':' . $e->getLine() . "\n\n" . $e->getTraceAsString(),
                    500,
                    ['Content-Type' => 'text/plain']
                );
            }
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function ($response, Throwable $e, Request $request) {
            // Biarkan Laravel menangani sendiri exception yang sudah punya format JSON
            if ($e instanceof \Illuminate\Auth\AuthenticationException
                || $e instanceof \Illuminate\Auth\Access\AuthorizationException
                || $e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                return $response;
            }

            // Untuk route api/*, kembalikan JSON seragam dengan request_id
            if ($request->is('api/*') || $request->expectsJson()) {
                $requestId = substr(md5(uniqid('', true)), 0, 12);

                // Log terstruktur ke stderr (tidak memuat data pribadi)
                error_log(json_encode([
                    'request_id' => $requestId,
                    'method'     => $request->method(),
                    'path'       => $request->path(),
                    'exception'  => get_class($e),
                    'message'    => $e->getMessage(),
                    'file'       => basename($e->getFile()) . ':' . $e->getLine(),
                ]));

                return response()->json([
                    'message'    => 'Terjadi kesalahan pada server. Coba lagi dalam beberapa saat.',
                    'request_id' => $requestId,
                ], 500);
            }

            return $response;
        });
    })->create()
    ->useStoragePath(isset($_ENV['APP_STORAGE']) ? $_ENV['APP_STORAGE'] : (is_writable(dirname(__DIR__).'/storage') ? dirname(__DIR__).'/storage' : '/tmp/storage'));
