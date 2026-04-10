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
            $table->renameColumn('customer_name', 'lead_name');
            $table->renameColumn('customer_phone', 'phone');
            $table->renameColumn('guest_count', 'number_of_guests');
            $table->renameColumn('reservation_time', 'reservation_date'); // Rename then change type
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->date('reservation_date')->change();
            $table->string('reservation_time')->after('reservation_date'); // Store time as string (HH:mm)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('reservation_time');
            $table->dateTime('reservation_date')->change();
            $table->renameColumn('reservation_date', 'reservation_time');
            $table->renameColumn('number_of_guests', 'guest_count');
            $table->renameColumn('phone', 'customer_phone');
            $table->renameColumn('lead_name', 'customer_name');
        });
    }
};
