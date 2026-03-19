<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;

Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);

use App\Http\Controllers\API\UserController;

Route::post('/login', [UserController::class, 'login']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
