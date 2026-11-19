<?php

namespace App\Services\Firebase;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Upload file ke Firebase Storage (Google Cloud Storage) via REST API.
 *
 * File yang di-upload bersifat publik dan dapat diakses langsung
 * melalui URL Firebase Storage CDN tanpa autentikasi.
 */
class FirebaseStorageService
{
    private string $projectId;
    private string $bucket;
    private ?string $credentialsPath;
    private ?string $credentialsBase64;
    private ?array $parsedCredentials = null;

    public function __construct()
    {
        $this->projectId = config('firebase.project_id', 'patrol-f0ab5');
        // Default Firebase Storage bucket: {project_id}.appspot.com
        $this->bucket = config('firebase.storage_bucket', $this->projectId . '.appspot.com');
        $this->credentialsPath = config('firebase.credentials_path');
        $this->credentialsBase64 = config('firebase.credentials_base64');
    }

    /**
     * Upload satu file ke Firebase Storage.
     * Mengembalikan public URL file yang di-upload.
     */
    public function upload(UploadedFile $file, string $directory = 'photos'): string
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $objectName = $directory . '/' . uniqid('', true) . '.' . $ext;
        
        // Hindari dependensi pada ext-fileinfo yang mungkin tidak aktif
        $mimeType = 'image/jpeg';
        try {
            $mimeType = $file->getClientMimeType() ?: ($file->getMimeType() ?: 'image/jpeg');
        } catch (\Throwable) {
            $map = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                'mp3' => 'audio/mpeg',
                'm4a' => 'audio/mp4',
                'wav' => 'audio/wav',
            ];
            $mimeType = $map[strtolower($ext)] ?? 'application/octet-stream';
        }
        $content = file_get_contents($file->getRealPath());

        if ($content === false) {
            throw new RuntimeException('Gagal membaca file yang di-upload.');
        }

        $token = $this->getAccessToken();
        $encodedName = rawurlencode($objectName);

        // Upload via Firebase Storage REST API (resumable/multipart)
        $uploadUrl = "https://storage.googleapis.com/upload/storage/v1/b/{$this->bucket}/o"
            . "?uploadType=media&name={$encodedName}&predefinedAcl=publicRead";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type'  => $mimeType,
        ])->withBody($content, $mimeType)->post($uploadUrl);

        if (!$response->successful()) {
            throw new RuntimeException(
                'Firebase Storage upload error [' . $response->status() . ']: ' . $response->body()
            );
        }

        // Public URL format Firebase Storage
        return "https://storage.googleapis.com/{$this->bucket}/{$encodedName}";
    }

    /**
     * Upload banyak file sekaligus. Mengembalikan array URL publik.
     */
    public function uploadMany(array $files, string $directory = 'photos'): array
    {
        $urls = [];
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $urls[] = $this->upload($file, $directory);
            }
        }
        return $urls;
    }

    /**
     * Hapus file dari Firebase Storage berdasarkan URL publiknya.
     */
    public function delete(string $publicUrl): bool
    {
        // Ekstrak object name dari URL
        $prefix = "https://storage.googleapis.com/{$this->bucket}/";
        if (!str_starts_with($publicUrl, $prefix)) {
            return false;
        }
        $encodedName = substr($publicUrl, strlen($prefix));
        $token = $this->getAccessToken();

        $deleteUrl = "https://storage.googleapis.com/storage/v1/b/{$this->bucket}/o/{$encodedName}";
        $res = Http::withToken($token)->delete($deleteUrl);

        return $res->successful() || $res->status() === 404;
    }

    // ─── OAuth2 Access Token ──────────────────────────────────────────────────

    private function getAccessToken(): string
    {
        $creds = $this->getCredentials();
        if (empty($creds)) {
            throw new RuntimeException('Firebase credentials tidak ditemukan untuk Firebase Storage.');
        }

        return Cache::remember('firebase_storage_access_token', 3000, function () use ($creds) {
            $now = time();
            $clientEmail = $creds['client_email'] ?? '';
            $privateKey  = $creds['private_key'] ?? '';

            if (empty($clientEmail) || empty($privateKey)) {
                throw new RuntimeException('Firebase credentials tidak valid (client_email atau private_key kosong).');
            }

            // Build JWT
            $header  = base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64url_encode(json_encode([
                'iss'   => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/devstorage.read_write',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'exp'   => $now + 3600,
                'iat'   => $now,
            ]));

            $dataToSign = "{$header}.{$payload}";
            $signature  = '';
            $key = openssl_pkey_get_private($privateKey);
            if (!$key) {
                throw new RuntimeException('Gagal memuat private key Firebase untuk Storage.');
            }
            if (!openssl_sign($dataToSign, $signature, $key, OPENSSL_ALGO_SHA256)) {
                throw new RuntimeException('Gagal menandatangani JWT untuk Firebase Storage.');
            }

            $jwt = $dataToSign . '.' . base64url_encode($signature);

            $res = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if (!$res->successful()) {
                throw new RuntimeException('Gagal mendapatkan access token Firebase Storage: ' . $res->body());
            }

            return $res->json('access_token');
        });
    }

    private function getCredentials(): ?array
    {
        if ($this->parsedCredentials !== null) {
            return $this->parsedCredentials;
        }

        if (!empty($this->credentialsBase64)) {
            $decoded = base64_decode($this->credentialsBase64, true);
            if ($decoded !== false) {
                $json = json_decode($decoded, true);
                if (is_array($json)) {
                    $this->parsedCredentials = $json;
                    return $this->parsedCredentials;
                }
            }
        }

        if (!empty($this->credentialsPath) && file_exists($this->credentialsPath)) {
            $content = file_get_contents($this->credentialsPath);
            if ($content !== false) {
                $json = json_decode($content, true);
                if (is_array($json)) {
                    $this->parsedCredentials = $json;
                    return $this->parsedCredentials;
                }
            }
        }

        return null;
    }
}

// Helper function — PHP 8.0+ tersedia di global scope
if (!function_exists('base64url_encode')) {
    function base64url_encode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
