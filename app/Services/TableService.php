<?php

namespace App\Services;

use App\Models\Table;

class TableService
{
    protected $orderService;

    public function __construct(\App\Services\OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * [WHY] Fetch all tables with their active orders for the dashboard
     * [RULE] Clean up expired drafts before fetching
     * [RULE] Eager load only required product fields
     */
    public function getAllTables()
    {
        $this->orderService->cleanupDrafts();
        return Table::with([
            'activeOrder.reservation',
            'activeOrders.reservation',
            'activeOrders.items.product' => function($query) {
                $query->select('id', 'name', 'price', 'type');
            }
        ])->get();
    }

    /**
     * [WHY] Create a new table in the system
     */
    public function createTable(array $data)
    {
        return Table::create($data);
    }

    /**
     * [WHY] Update table details (name, capacity, etc)
     */
    public function updateTable($id, array $data)
    {
        $table = Table::findOrFail($id);
        $table->update($data);
        return $table;
    }

    /**
     * [WHY] Remove table from system
     */
    public function deleteTable($id)
    {
        $table = Table::findOrFail($id);
        $table->delete();
    }
}
