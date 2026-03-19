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
        Schema::create('tables', function (Blueprint $table) {
            $table->id();

            $table->string('name'); 
            // Tên bàn: Bàn 1, Bàn 2

            $table->string('status')->default('empty'); 
            // Trạng thái: empty | busy | reserved

            $table->integer('capacity')->default(4); 
            // Số người ngồi

            $table->timestamps();
            // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};