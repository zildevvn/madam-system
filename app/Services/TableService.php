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

    public function getAllTables()
    {
        $this->orderService->cleanupDrafts();
        return Table::with('activeOrder')->get();
    }

    public function createTable(array $data)
    {
        return Table::create($data);
    }

    public function updateTable($id, array $data)
    {
        $table = Table::findOrFail($id);
        $table->update($data);
        return $table;
    }

    public function deleteTable($id)
    {
        $table = Table::findOrFail($id);
        $table->delete();
    }
}
