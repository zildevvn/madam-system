<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Services\ExpenseService;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    protected $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $expenses = $this->expenseService->getAllExpenses();
        
        return response()->json([
            'data' => $expenses,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreExpenseRequest $request)
    {
        $expense = $this->expenseService->createExpense($request->validated());
        
        return response()->json([
            'data' => $expense->load('user:id,name'),
            'message' => 'Expense recorded successfully',
            'errors' => null
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateExpenseRequest $request, string $id)
    {
        $expense = $this->expenseService->updateExpense($id, $request->validated());

        return response()->json([
            'data' => $expense->load('user:id,name'),
            'message' => 'Expense updated successfully',
            'errors' => null
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->expenseService->deleteExpense($id);

        return response()->json([
            'data' => null,
            'message' => 'Expense deleted successfully',
            'errors' => null
        ]);
    }
}
