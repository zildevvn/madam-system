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
            // [WHY] Drop column to remove dependence on product catalog
            $table->dropColumn('product_id');
            
            // [WHY] Add type to allow Kitchen/Bar filtering without product_id
            $table->string('type')->default('food')->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservation_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->after('reservation_id');
            $table->dropColumn('type');
        });
    }
};
