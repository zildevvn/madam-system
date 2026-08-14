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
        Schema::table('order_items', function (Blueprint $table) {
            $table->integer('sort_order')->nullable()->after('id');
        });

        // Backfill data: Assign sort_order based on existing ID sequence per order_id
        DB::table('order_items')
            ->select('order_id')
            ->distinct()
            ->orderBy('order_id')
            ->chunk(100, function ($orders) {
                foreach ($orders as $order) {
                    $items = DB::table('order_items')
                        ->where('order_id', $order->order_id)
                        ->orderBy('id', 'asc')
                        ->get(['id']);
                    
                    $sort = 1;
                    foreach ($items as $item) {
                        DB::table('order_items')
                            ->where('id', $item->id)
                            ->update(['sort_order' => $sort]);
                        $sort++;
                    }
                }
            });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
