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
        Schema::create('partner_companies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('partner_company_id')->nullable()->after('company_name');
            $table->foreign('partner_company_id')->references('id')->on('partner_companies')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['partner_company_id']);
            $table->dropColumn('partner_company_id');
        });

        Schema::dropIfExists('partner_companies');
    }
};
