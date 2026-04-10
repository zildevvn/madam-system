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
        Schema::table('order_items', function (Blueprint $table) {
            // [WHY] Store dish name explicitly to support ID-less dishes from reservations
            $table->string('name')->nullable()->after('product_id');
            
            // [WHY] Store type (food/drink) for proper dashboard filtering
            $table->string('type')->default('food')->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['name', 'type']);
        });
    }
};
