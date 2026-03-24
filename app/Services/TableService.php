<?php

namespace App\Services;

use App\Models\Table;

class TableService
{
    public function getAllTables()
    {
        return Table::all();
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
