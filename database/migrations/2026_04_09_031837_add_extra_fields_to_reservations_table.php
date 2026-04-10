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
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('type')->default('individual')->after('id'); // individual, group
            $table->integer('guest_count')->default(1)->after('customer_phone');
            $table->string('email')->nullable()->after('guest_count');
            $table->string('nationality')->nullable()->after('email');
            $table->string('tour_guide_name')->nullable()->after('nationality');
            $table->string('company_name')->nullable()->after('tour_guide_name');
            $table->string('set_menu')->nullable()->after('company_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['type', 'guest_count', 'email', 'nationality', 'tour_guide_name', 'company_name', 'set_menu']);
        });
    }
};
