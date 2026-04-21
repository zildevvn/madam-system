<?php

namespace App\Services;

use App\Models\Expense;

class ExpenseService
{
    /**
     * Retrieve all expenses, ordered by date descending.
     * Eager loads the user relationship.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllExpenses()
    {
        return Expense::with('user:id,name')->orderBy('date', 'desc')->get();
    }

    /**
     * Create a new expense record.
     *
     * @param array $data
     * @return Expense
     */
    public function createExpense(array $data)
    {
        return Expense::create($data);
    }

    /**
     * Update an existing expense record.
     *
     * @param string $id
     * @param array $data
     * @return Expense
     */
    public function updateExpense(string $id, array $data)
    {
        $expense = Expense::findOrFail($id);
        $expense->update($data);

        return $expense;
    }

    /**
     * Delete an existing expense record.
     *
     * @param string $id
     * @return bool|null
     */
    public function deleteExpense(string $id)
    {
        $expense = Expense::findOrFail($id);
        return $expense->delete();
    }
}
