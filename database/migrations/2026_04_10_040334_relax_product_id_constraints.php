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
        Schema::table('reservation_items', function (Blueprint $table) {
            // [WHY] Drop foreign key to allow custom dish IDs (e.g. 1001) not in products catalog
            $table->dropForeign(['product_id']);
            $table->unsignedBigInteger('product_id')->nullable()->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            // [WHY] Also drop in order_items as reservations are eventually converted to orders
            $table->dropForeign(['product_id']);
            $table->unsignedBigInteger('product_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservation_items', function (Blueprint $table) {
            $table->foreignId('product_id')->change()->constrained();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('product_id')->change()->constrained();
        });
    }
};
