<?php

namespace App\Repositories\Static;

use App\Contracts\Repositories\CategoryRepositoryInterface;

class StaticCategoryRepository implements CategoryRepositoryInterface
{
    private const CATEGORIES = [
        [
            'id' => '1',
            'type' => 'INFRASTRUKTUR',
            'name' => 'Infrastruktur',
            'icon' => 'road',
            'description' => 'Jalan, jembatan, drainase, lampu jalan, fasilitas umum.',
            'base_score' => 40,
        ],
        [
            'id' => '2',
            'type' => 'KEBERSIHAN',
            'name' => 'Kebersihan',
            'icon' => 'trash',
            'description' => 'Sampah, TPS, kebersihan fasilitas publik.',
            'base_score' => 30,
        ],
        [
            'id' => '3',
            'type' => 'KEAMANAN',
            'name' => 'Keamanan',
            'icon' => 'shield',
            'description' => 'Gangguan ketertiban, kriminalitas, kerawanan wilayah.',
            'base_score' => 50,
        ],
        [
            'id' => '4',
            'type' => 'BANJIR',
            'name' => 'Banjir',
            'icon' => 'water',
            'description' => 'Genangan, banjir rob, saluran tersumbat.',
            'base_score' => 45,
        ],
        [
            'id' => '5',
            'type' => 'LAINNYA',
            'name' => 'Lainnya',
            'icon' => 'dots',
            'description' => 'Laporan lain yang tidak masuk kategori di atas.',
            'base_score' => 25,
        ],
    ];

    public function all(): array
    {
        return self::CATEGORIES;
    }

    public function findByType(string $type): ?array
    {
        $normalized = strtoupper(trim($type));
        foreach (self::CATEGORIES as $cat) {
            if ($cat['type'] === $normalized) {
                return $cat;
            }
        }
        return null;
    }
}

