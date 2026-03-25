<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;

use App\Http\Controllers\API\OrderController;

Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);

Route::get('/tables/{id}/active-order', [OrderController::class, 'activeOrder']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/{id}/checkout', [OrderController::class, 'checkout']);
Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
Route::put('/order-items/{itemId}/status', [OrderController::class, 'updateItemStatus']);

use App\Http\Controllers\API\UserController;

Route::post('/login', [UserController::class, 'login']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
