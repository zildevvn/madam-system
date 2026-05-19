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
        Schema::table('users', function (Blueprint $table) {
            $table->date('join_date')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('work_shift')->nullable();
            $table->decimal('salary', 15, 2)->nullable();
            $table->decimal('bonus', 15, 2)->nullable();
            $table->text('address')->nullable();
            $table->string('id_card_image')->nullable();
            $table->string('contract_image')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'join_date',
                'date_of_birth',
                'work_shift',
                'salary',
                'bonus',
                'address',
                'id_card_image',
                'contract_image'
            ]);
        });
    }
};
