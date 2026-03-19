<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    // get all tables
    public function index()
    {
        return response()->json(Table::all());
    }

    // create table
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'status' => 'string',
            'capacity' => 'integer'
        ]);

        $table = Table::create($validated);

        return response()->json($table, 201);
    }

    // update table
    public function update(Request $request, $id)
    {
        $table = Table::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string',
            'status' => 'string',
            'capacity' => 'integer'
        ]);

        $table->update($validated);

        return response()->json($table);
    }

    // delete table
    public function destroy($id)
    {
        $table = Table::findOrFail($id);
        $table->delete();

        return response()->json(null, 204);
    }
}