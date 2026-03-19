<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;

Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);
