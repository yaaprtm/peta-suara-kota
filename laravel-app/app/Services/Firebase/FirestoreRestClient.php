<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class FirestoreRestClient implements FirestoreClientInterface
{
    private string $projectId;
    private string $databaseId;
    private ?string $emulatorHost;
    private ?string $credentialsPath;
    private ?string $credentialsBase64;
    private ?array $parsedCredentials = null;

    public function __construct(
        array|string|null $projectIdOrConfig = null,
        ?string $databaseId = null,
        ?string $emulatorHost = null,
        ?string $credentialsPath = null,
        ?string $credentialsBase64 = null
    ) {
        $getConfig = fn($key, $default = null) => function_exists('config') ? config($key, $default) : $default;

        if (is_array($projectIdOrConfig)) {
            $config = $projectIdOrConfig;
            $this->projectId = $config['project_id'] ?? $getConfig('firebase.project_id', 'peta-suara-kota');
            $this->databaseId = $config['database_id'] ?? $getConfig('firebase.database_id', '(default)');
            $this->emulatorHost = $config['emulator_host'] ?? $getConfig('firebase.emulator_host');
            $this->credentialsPath = $config['credentials_path'] ?? $getConfig('firebase.credentials_path');
            $this->credentialsBase64 = $config['credentials_base64'] ?? $getConfig('firebase.credentials_base64');
        } else {
            $this->projectId = $projectIdOrConfig ?? $getConfig('firebase.project_id', 'peta-suara-kota');
            $this->databaseId = $databaseId ?? $getConfig('firebase.database_id', '(default)');
            $this->emulatorHost = $emulatorHost ?? $getConfig('firebase.emulator_host');
            $this->credentialsPath = $credentialsPath ?? $getConfig('firebase.credentials_path');
            $this->credentialsBase64 = $credentialsBase64 ?? $getConfig('firebase.credentials_base64');
        }
    }

    /**
     * URL dasar dokumen Firestore
     */
    public function getBaseUrl(): string
    {
        if (!empty($this->emulatorHost)) {
            $host = rtrim($this->emulatorHost, '/');
            if (!str_starts_with($host, 'http://') && !str_starts_with($host, 'https://')) {
                $host = 'http://' . $host;
            }
            return "{$host}/v1/projects/{$this->projectId}/databases/{$this->databaseId}/documents";
        }

        return "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/{$this->databaseId}/documents";
    }

    /**
     * Mendapatkan Bearer Authorization token untuk Google Cloud API
     */
    private function getAccessToken(): ?string
    {
        // Emulator tidak memerlukan token OAuth2
        if (!empty($this->emulatorHost)) {
            return null;
        }

        $creds = $this->getCredentials();
        if (empty($creds)) {
            return null;
        }

        return Cache::remember('firebase_access_token', 3000, function () use ($creds) {
            $now = time();
            $clientEmail = $creds['client_email'] ?? '';
            $privateKey = $creds['private_key'] ?? '';

            if (empty($clientEmail) || empty($privateKey)) {
                throw new RuntimeException('Kredensial Firebase tidak valid (client_email atau private_key kosong).');
            }

            // 1. Buat JWT Claims
            $header = ['alg' => 'RS256', 'typ' => 'JWT'];
            $payload = [
                'iss' => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/datastore',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ];

            $base64UrlHeader = $this->base64UrlEncode(json_encode($header));
            $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));
            $dataToSign = "{$base64UrlHeader}.{$base64UrlPayload}";

            $signature = '';
            $keyResource = openssl_pkey_get_private($privateKey);
            if (!$keyResource) {
                throw new RuntimeException('Gagal memuat private_key service account Firebase.');
            }

            if (!openssl_sign($dataToSign, $signature, $keyResource, OPENSSL_ALGO_SHA256)) {
                throw new RuntimeException('Gagal menandatangani JWT Firebase dengan OpenSSL.');
            }

            $jwt = "{$dataToSign}." . $this->base64UrlEncode($signature);

            // 2. Tukar JWT dengan Google OAuth2 Access Token
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (!$response->successful()) {
                throw new RuntimeException('Gagal mendapatkan access token Firebase: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    /**
     * HTTP Client yang telah disiapkan dengan header yang sesuai
     */
    private function client(): \Illuminate\Http\Client\PendingRequest
    {
        $client = Http::acceptJson()->contentType('application/json');
        $token = $this->getAccessToken();
        if ($token) {
            $client = $client->withToken($token);
        }
        return $client;
    }

    /**
     * Membaca isi kredensial JSON
     */
    public function getCredentials(): ?array
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

    public function getDocument(string $collection, string $documentId): ?array
    {
        $url = $this->getBaseUrl() . "/{$collection}/{$documentId}";
        $res = $this->client()->get($url);

        if ($res->status() === 404) {
            return null;
        }

        if (!$res->successful()) {
            throw new RuntimeException("Firestore getDocument error [{$res->status()}]: {$res->body()}");
        }

        $raw = $res->json();
        return $this->decodeDocument($raw);
    }

    public function createDocument(string $collection, string $documentId, array $data, bool $ifAbsent = false): array
    {
        $url = $this->getBaseUrl() . "/{$collection}?documentId=" . urlencode($documentId);
        $encodedFields = $this->encodeFields($data);

        $res = $this->client()->post($url, [
            'fields' => $encodedFields,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Firestore createDocument error [{$res->status()}]: {$res->body()}");
        }

        return $this->decodeDocument($res->json());
    }

    public function patchDocument(string $collection, string $documentId, array $data, ?array $updateMask = null): array
    {
        $url = $this->getBaseUrl() . "/{$collection}/" . urlencode($documentId);
        $encodedFields = $this->encodeFields($data);

        $params = [];
        $keys = $updateMask ?? array_keys($data);
        foreach ($keys as $k) {
            $params[] = 'updateMask.fieldPaths=' . urlencode($k);
        }

        if (!empty($params)) {
            $url .= '?' . implode('&', $params);
        }

        $res = $this->client()->patch($url, [
            'fields' => $encodedFields,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Firestore patchDocument error [{$res->status()}]: {$res->body()}");
        }

        return $this->decodeDocument($res->json());
    }

    public function deleteDocument(string $collection, string $documentId): bool
    {
        $url = $this->getBaseUrl() . "/{$collection}/" . urlencode($documentId);
        $res = $this->client()->delete($url);

        return $res->successful() || $res->status() === 404;
    }

    public function runQuery(string $collection, array $structuredQuery): array
    {
        $url = $this->getBaseUrl() . ':runQuery';

        // Pastikan from collection disetel jika belum ada
        if (!isset($structuredQuery['from'])) {
            $structuredQuery['from'] = [['collectionId' => $collection]];
        }

        $res = $this->client()->post($url, [
            'structuredQuery' => $structuredQuery,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Firestore runQuery error [{$res->status()}]: {$res->body()}");
        }

        $results = [];
        $rows = $res->json() ?? [];
        foreach ($rows as $row) {
            if (!empty($row['document'])) {
                $results[] = $this->decodeDocument($row['document']);
            }
        }

        return $results;
    }

    public function commit(array $writes): array
    {
        $url = $this->getBaseUrl() . ':commit';
        $res = $this->client()->post($url, [
            'writes' => $writes,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Firestore commit error [{$res->status()}]: {$res->body()}");
        }

        return $res->json() ?? [];
    }

    /**
     * Mengubah Firestore document payload mentah menjadi associative array data
     */
    public function decodeDocument(array $doc): array
    {
        $fields = $doc['fields'] ?? [];
        $decoded = $this->decodeFields($fields);

        // Ambil ID dokumen dari name path jika ada: projects/.../databases/.../documents/{collection}/{id}
        if (!empty($doc['name'])) {
            $parts = explode('/', $doc['name']);
            $id = end($parts);
            if (!isset($decoded['id'])) {
                $decoded['id'] = $id;
            }
        }

        if (!empty($doc['createTime']) && !isset($decoded['created_at'])) {
            $decoded['created_at'] = $doc['createTime'];
        }
        if (!empty($doc['updateTime']) && !isset($decoded['updated_at'])) {
            $decoded['updated_at'] = $doc['updateTime'];
        }

        return $decoded;
    }

    /**
     * Konversi rekursif dari tipe Firestore ke tipe PHP native
     */
    public function decodeFields(array $fields): array
    {
        $result = [];
        foreach ($fields as $key => $val) {
            $result[$key] = $this->decodeValue($val);
        }
        return $result;
    }

    public function decodeValue(array $val): mixed
    {
        if (array_key_exists('stringValue', $val)) return $val['stringValue'];
        if (array_key_exists('integerValue', $val)) return (int) $val['integerValue'];
        if (array_key_exists('doubleValue', $val)) return (float) $val['doubleValue'];
        if (array_key_exists('booleanValue', $val)) return (bool) $val['booleanValue'];
        if (array_key_exists('timestampValue', $val)) return $val['timestampValue'];
        if (array_key_exists('nullValue', $val)) return null;
        if (array_key_exists('arrayValue', $val)) {
            $arr = [];
            foreach ($val['arrayValue']['values'] ?? [] as $item) {
                $arr[] = $this->decodeValue($item);
            }
            return $arr;
        }
        if (array_key_exists('mapValue', $val)) {
            return $this->decodeFields($val['mapValue']['fields'] ?? []);
        }
        return null;
    }

    /**
     * Konversi rekursif dari associative array PHP ke tipe Firestore Value
     */
    public function encodeFields(array $data): array
    {
        $result = [];
        foreach ($data as $key => $val) {
            $result[$key] = $this->encodeValue($val);
        }
        return $result;
    }

    public function encodeValue(mixed $val): array
    {
        if (is_null($val)) return ['nullValue' => null];
        if (is_bool($val)) return ['booleanValue' => $val];
        if (is_int($val)) return ['integerValue' => (string) $val];
        if (is_float($val)) return ['doubleValue' => $val];
        if ($val instanceof \DateTimeInterface) {
            return ['timestampValue' => $val->format('Y-m-d\TH:i:s.000\Z')];
        }
        if (is_string($val)) {
            // Deteksi format ISO 8601 UTC timestamp (misal: 2026-11-17T10:00:00.000Z)
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/', $val)) {
                return ['timestampValue' => $val];
            }
            return ['stringValue' => $val];
        }
        if (is_array($val)) {
            // Cek apakah sequential array atau associative array (map)
            if (array_is_list($val)) {
                $values = [];
                foreach ($val as $item) {
                    $values[] = $this->encodeValue($item);
                }
                return ['arrayValue' => ['values' => $values]];
            } else {
                return ['mapValue' => ['fields' => $this->encodeFields($val)]];
            }
        }
        return ['stringValue' => (string) $val];
    }

    private function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}

