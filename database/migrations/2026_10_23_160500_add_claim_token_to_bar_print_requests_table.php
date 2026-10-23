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
        Schema::table('bar_print_requests', function (Blueprint $table) {
            $table->string('claim_token', 64)->nullable()->after('claimed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bar_print_requests', function (Blueprint $table) {
            $table->dropColumn('claim_token');
        });
    }
};
