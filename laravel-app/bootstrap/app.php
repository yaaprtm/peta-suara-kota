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
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->respond(function ($response, Throwable $e) {
            if ($e instanceof \Illuminate\Auth\AuthenticationException
                || $e instanceof \Illuminate\Auth\Access\AuthorizationException
                || $e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                return $response;
            }

            if (request()->has('debug')) {
                return response(
                    "ERROR: " . $e->getMessage() . "\n" .
                    "FILE: " . $e->getFile() . ":" . $e->getLine() . "\n\n" .
                    $e->getTraceAsString(),
                    500,
                    ['Content-Type' => 'text/plain']
                );
            }
            return $response;
        });
    })->create()
    ->useStoragePath(isset($_ENV['APP_STORAGE']) ? $_ENV['APP_STORAGE'] : (is_writable(dirname(__DIR__).'/storage') ? dirname(__DIR__).'/storage' : '/tmp/storage'));
