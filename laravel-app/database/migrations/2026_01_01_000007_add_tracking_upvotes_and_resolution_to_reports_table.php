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
        Schema::table('reports', function (Blueprint $table) {
            $table->string('tracking_code', 32)->nullable()->unique()->after('id');
            $table->unsignedInteger('upvotes_count')->default(0)->after('skor_urgensi');
            $table->json('completion_photos')->nullable()->after('photos');
            $table->text('completion_note')->nullable()->after('completion_photos');
            $table->timestamp('resolved_at')->nullable()->after('updated_at');

            $table->index('tracking_code');
            $table->index('upvotes_count');
            $table->index('resolved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['tracking_code']);
            $table->dropIndex(['upvotes_count']);
            $table->dropIndex(['resolved_at']);
            $table->dropColumn([
                'tracking_code',
                'upvotes_count',
                'completion_photos',
                'completion_note',
                'resolved_at',
            ]);
        });
    }
};
