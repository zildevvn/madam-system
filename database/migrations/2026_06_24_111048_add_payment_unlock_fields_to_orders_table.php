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
        Schema::table('orders', function (Blueprint $table) {
            $table->dateTime('completed_at')->nullable();
            $table->unsignedBigInteger('payment_unlocked_by')->nullable();
            $table->dateTime('payment_unlocked_at')->nullable();
            $table->boolean('is_payment_unlocked')->default(false);

            $table->foreign('payment_unlocked_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['payment_unlocked_by']);
            $table->dropColumn(['completed_at', 'payment_unlocked_by', 'payment_unlocked_at', 'is_payment_unlocked']);
        });
    }
};
