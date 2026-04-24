<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // [WHY] Separate from cashier_note (payment-time). This note is set by order staff
            // during the ordering process and is displayed on the bill page.
            $table->string('order_note', 500)->nullable()->after('cashier_note');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_note');
        });
    }
};
