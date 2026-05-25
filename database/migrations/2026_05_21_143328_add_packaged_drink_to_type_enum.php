<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE products MODIFY type ENUM('food', 'drink', 'packaged_drink')");
            DB::statement("ALTER TABLE categories MODIFY type ENUM('food', 'drink', 'packaged_drink')");
            DB::statement("ALTER TABLE order_items MODIFY type ENUM('food', 'drink', 'packaged_drink')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('type_enum', function (Blueprint $table) {
            //
        });
    }
};
