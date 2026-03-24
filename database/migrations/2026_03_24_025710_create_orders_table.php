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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->enum('order_type', ['dine-in', 'takeout'])->default('dine-in');
            $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
            $table->integer('total_price')->default(0);
            $table->timestamps();
            
            $table->index('table_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
