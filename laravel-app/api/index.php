<?php

// ─── Vercel Serverless Function Handler for Laravel 13 ───────────────────────

$storagePath = '/tmp/storage';
$bootstrapCachePath = $storagePath . '/bootstrap/cache';

$requiredDirs = [
    $storagePath . '/framework/views',
    $storagePath . '/framework/cache',
    $storagePath . '/framework/sessions',
    $storagePath . '/logs',
    $bootstrapCachePath,
];

foreach ($requiredDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Redirect storage path to writable /tmp
putenv("APP_STORAGE={$storagePath}");
$_ENV['APP_STORAGE'] = $storagePath;

putenv("VIEW_COMPILED_PATH={$storagePath}/framework/views");
$_ENV['VIEW_COMPILED_PATH'] = "{$storagePath}/framework/views";

// Redirect Laravel bootstrap cache files to writable /tmp
putenv("APP_SERVICES_CACHE={$bootstrapCachePath}/services.php");
$_ENV['APP_SERVICES_CACHE'] = "{$bootstrapCachePath}/services.php";

putenv("APP_PACKAGES_CACHE={$bootstrapCachePath}/packages.php");
$_ENV['APP_PACKAGES_CACHE'] = "{$bootstrapCachePath}/packages.php";

putenv("APP_CONFIG_CACHE={$bootstrapCachePath}/config.php");
$_ENV['APP_CONFIG_CACHE'] = "{$bootstrapCachePath}/config.php";

putenv("APP_ROUTES_CACHE={$bootstrapCachePath}/routes-v7.php");
$_ENV['APP_ROUTES_CACHE'] = "{$bootstrapCachePath}/routes-v7.php";

putenv("APP_EVENTS_CACHE={$bootstrapCachePath}/events.php");
$_ENV['APP_EVENTS_CACHE'] = "{$bootstrapCachePath}/events.php";

// Copy existing bootstrap cache if present to writable /tmp so Laravel doesn't fail on read-only filesystem
$srcCache = __DIR__ . '/../bootstrap/cache';
if (is_dir($srcCache)) {
    foreach (scandir($srcCache) as $file) {
        if ($file !== '.' && $file !== '..' && $file !== '.gitignore') {
            $dest = "{$bootstrapCachePath}/{$file}";
            if (!file_exists($dest)) {
                @copy("{$srcCache}/{$file}", $dest);
            }
        }
    }
}

$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../public/index.php';
$_SERVER['HTTPS'] = 'on';
$_SERVER['SERVER_PORT'] = '443';

ini_set('display_errors', '0');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "SERVERLESS EXCEPTION:\n";
    echo $e->getMessage() . "\n\n";
    echo $e->getFile() . ':' . $e->getLine() . "\n\n";
    echo $e->getTraceAsString();
    exit(1);
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: text/plain');
        echo "FATAL PHP ERROR:\n";
        print_r($error);
    }
});

try {
    require __DIR__ . '/../public/index.php';
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "SERVERLESS EXCEPTION (UNCAUGHT):\n";
    echo get_class($e) . ': ' . $e->getMessage() . "\n\n";
    echo "File: " . $e->getFile() . ':' . $e->getLine() . "\n\n";
    echo $e->getTraceAsString();
    exit(1);
}
