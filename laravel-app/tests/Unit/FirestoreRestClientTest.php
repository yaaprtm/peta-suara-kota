<?php

namespace Tests\Unit;

use App\Services\Firebase\FirestoreRestClient;
use Tests\TestCase;

class FirestoreRestClientTest extends TestCase
{
    private FirestoreRestClient $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = new FirestoreRestClient([
            'project_id' => 'test-project',
            'database_id' => '(default)',
            'emulator_host' => '127.0.0.1:8080',
        ]);
    }

    public function test_encode_and_decode_primitive_types(): void
    {
        $input = [
            'name' => 'Laporan Lubang Jalan',
            'upvotes' => 12,
            'skor_urgensi' => 45.5,
            'is_resolved' => false,
            'deleted_at' => null,
        ];

        $encoded = $this->client->encodeFields($input);

        $this->assertEquals(['stringValue' => 'Laporan Lubang Jalan'], $encoded['name']);
        $this->assertEquals(['integerValue' => '12'], $encoded['upvotes']);
        $this->assertEquals(['doubleValue' => 45.5], $encoded['skor_urgensi']);
        $this->assertEquals(['booleanValue' => false], $encoded['is_resolved']);
        $this->assertEquals(['nullValue' => null], $encoded['deleted_at']);

        $decoded = $this->client->decodeFields($encoded);

        $this->assertSame('Laporan Lubang Jalan', $decoded['name']);
        $this->assertSame(12, $decoded['upvotes']);
        $this->assertSame(45.5, $decoded['skor_urgensi']);
        $this->assertSame(false, $decoded['is_resolved']);
        $this->assertNull($decoded['deleted_at']);
    }

    public function test_encode_and_decode_nested_array_and_map(): void
    {
        $input = [
            'tags' => ['jalan', 'rusak', 'prioritas'],
            'location' => [
                'lat' => -7.2575,
                'lng' => 112.7400,
                'kecamatan' => 'Genteng',
            ],
            'status_logs' => [
                [
                    'to_status' => 'BARU',
                    'note' => 'Dibuat',
                ],
                [
                    'to_status' => 'DIPROSES',
                    'note' => 'Sedang dicek',
                ],
            ],
        ];

        $encoded = $this->client->encodeFields($input);
        $this->assertArrayHasKey('arrayValue', $encoded['tags']);
        $this->assertArrayHasKey('mapValue', $encoded['location']);
        $this->assertArrayHasKey('arrayValue', $encoded['status_logs']);

        $decoded = $this->client->decodeFields($encoded);

        $this->assertEquals(['jalan', 'rusak', 'prioritas'], $decoded['tags']);
        $this->assertEquals(-7.2575, $decoded['location']['lat']);
        $this->assertEquals(112.7400, $decoded['location']['lng']);
        $this->assertEquals('Genteng', $decoded['location']['kecamatan']);
        $this->assertCount(2, $decoded['status_logs']);
        $this->assertEquals('BARU', $decoded['status_logs'][0]['to_status']);
        $this->assertEquals('DIPROSES', $decoded['status_logs'][1]['to_status']);
    }

    public function test_encode_and_decode_timestamp(): void
    {
        $isoTimestamp = '2026-11-17T10:00:00.000Z';
        $input = [
            'created_at' => $isoTimestamp,
        ];

        $encoded = $this->client->encodeFields($input);
        $this->assertEquals(['timestampValue' => $isoTimestamp], $encoded['created_at']);

        $decoded = $this->client->decodeFields($encoded);
        $this->assertEquals($isoTimestamp, $decoded['created_at']);
    }
}

