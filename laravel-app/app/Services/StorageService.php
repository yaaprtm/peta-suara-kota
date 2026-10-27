<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class StorageService
{
    /**
     * Get the appropriate storage disk based on environment.
     * 
     * In production (Vercel), use S3-compatible storage.
     * In local development, use public disk.
     *
     * @return string
     */
    public static function disk(): string
    {
        return config('filesystems.default');
    }

    /**
     * Store an uploaded file and return its path.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  string  $directory
     * @param  string  $visibility
     * @return string
     */
    public static function storeFile(
        UploadedFile $file,
        string $directory = 'uploads',
        string $visibility = 'public'
    ): string {
        $disk = self::disk();
        $path = $file->store($directory, [
            'disk' => $disk,
            'visibility' => $visibility,
        ]);

        return $path;
    }

    /**
     * Store multiple uploaded files and return their paths.
     *
     * @param  array  $files
     * @param  string  $directory
     * @param  string  $visibility
     * @return array
     */
    public static function storeFiles(
        array $files,
        string $directory = 'uploads',
        string $visibility = 'public'
    ): array {
        $paths = [];
        
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $paths[] = self::storeFile($file, $directory, $visibility);
            }
        }

        return $paths;
    }

    /**
     * Get the full URL for a stored file.
     *
     * @param  string  $path
     * @return string
     */
    public static function url(string $path): string
    {
        $disk = self::disk();
        
        return Storage::disk($disk)->url($path);
    }

    /**
     * Delete a file from storage.
     *
     * @param  string  $path
     * @return bool
     */
    public static function delete(string $path): bool
    {
        $disk = self::disk();
        
        return Storage::disk($disk)->delete($path);
    }

    /**
     * Delete multiple files from storage.
     *
     * @param  array  $paths
     * @return bool
     */
    public static function deleteFiles(array $paths): bool
    {
        $disk = self::disk();
        
        return Storage::disk($disk)->delete($paths);
    }

    /**
     * Check if a file exists in storage.
     *
     * @param  string  $path
     * @return bool
     */
    public static function exists(string $path): bool
    {
        $disk = self::disk();
        
        return Storage::disk($disk)->exists($path);
    }

    /**
     * Generate a temporary URL for a private file (S3 only).
     *
     * @param  string  $path
     * @param  int  $expiresIn Seconds until expiration
     * @return string
     */
    public static function temporaryUrl(string $path, int $expiresIn = 3600): string
    {
        $disk = self::disk();
        
        // Only S3 supports temporary URLs
        if ($disk === 's3') {
            return Storage::disk($disk)->temporaryUrl($path, now()->addSeconds($expiresIn));
        }
        
        // Fallback to regular URL for local storage
        return self::url($path);
    }
}

