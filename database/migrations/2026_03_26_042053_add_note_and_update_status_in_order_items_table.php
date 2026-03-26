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
            $table->string('note')->nullable()->after('price');
            $table->enum('status', ['pending', 'cooking', 'ready', 'served'])->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('note');
            $table->enum('status', ['pending', 'preparing', 'done', 'delivered'])->default('pending')->change();
        });
    }
};
