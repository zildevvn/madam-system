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
        Schema::create('bar_print_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 100)->unique();
            $table->unsignedBigInteger('order_id')->index();
            $table->string('table_name', 100);
            $table->unsignedBigInteger('table_id')->nullable();
            $table->string('title', 100)->default('PHIẾU PHA CHẾ');
            $table->json('items');
            $table->text('order_note')->nullable();
            $table->string('staff_name', 100)->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending, printed, failed
            $table->timestamp('printed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bar_print_requests');
    }
};
