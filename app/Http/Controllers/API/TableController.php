<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\TableService;
use Illuminate\Http\Request;

class TableController extends Controller
{
    protected $tableService;

    public function __construct(TableService $tableService)
    {
        $this->tableService = $tableService;
    }

    // get all tables
    public function index()
    {
        $tables = $this->tableService->getAllTables();
        return response()->json([
            'data' => $tables,
            'message' => 'Success'
        ]);
    }

    // create table
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'status' => 'string',
            'capacity' => 'integer'
        ]);

        $table = $this->tableService->createTable($validated);

        return response()->json([
            'data' => $table,
            'message' => 'Table created successfully'
        ], 201);
    }

    // update table
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'string',
            'status' => 'string',
            'capacity' => 'integer'
        ]);

        $table = $this->tableService->updateTable($id, $validated);

        return response()->json([
            'data' => $table,
            'message' => 'Table updated successfully'
        ]);
    }

    // delete table
    public function destroy($id)
    {
        $this->tableService->deleteTable($id);

        return response()->json([
            'data' => null,
            'message' => 'Table deleted successfully'
        ], 200);
    }
}