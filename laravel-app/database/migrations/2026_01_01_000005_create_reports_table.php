<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description');
            $table->string('category'); // INFRASTRUKTUR, KEBERSIHAN, KEAMANAN, BANJIR, LAINNYA
            $table->string('status')->default('BARU'); // BARU, DIPROSES, SELESAI, DITOLAK

            // Location coordinates with decimal index
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->text('address')->nullable();
            $table->foreignUuid('kelurahan_id')->nullable()->constrained('kelurahans')->nullOnDelete();
            $table->string('kecamatan')->nullable();

            // Urgency scoring & keywords
            $table->integer('skor_urgensi')->default(0); // 0 - 100
            $table->json('urgensi_keywords')->nullable();

            // Media
            $table->json('photos')->nullable();
            $table->string('audio_url')->nullable();
            $table->text('audio_transcript')->nullable();

            // Relations
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();

            $table->timestamps();

            // Required query performance indexes
            $table->index('created_at');
            $table->index('status');
            $table->index('skor_urgensi');
            $table->index('category');
            $table->index('kelurahan_id');
            $table->index('kecamatan');
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
