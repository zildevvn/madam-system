<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;

use App\Http\Controllers\API\OrderController;

Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);

Route::get('/tables/{id}/active-order', [OrderController::class, 'activeOrder']);
Route::get('/orders/history', [OrderController::class, 'history']);
Route::post('/orders/{id}/reopen', [OrderController::class, 'reopen']);
Route::patch('/orders/{id}/payment', [OrderController::class, 'updatePayment']);

Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/{id}/checkout', [OrderController::class, 'checkout']);
Route::post('/orders/{id}/complete', [OrderController::class, 'complete']);
Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
Route::put('/orders/{id}/table', [OrderController::class, 'updateTable']);
Route::post('/orders/{id}/print-drinks', [OrderController::class, 'printDrinkBill']);
Route::put('/order-items/{itemId}/status', [OrderController::class, 'updateItemStatus']);

use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ProductController;

Route::post('/login', [UserController::class, 'login']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

Route::get('/products', [ProductController::class, 'index']);

use App\Http\Controllers\API\DebugController;
use App\Http\Controllers\API\ReservationController;

Route::get('/debug/printer', [DebugController::class, 'checkPrinter']);
Route::get('/debug/broadcast', [DebugController::class, 'sendTestBroadcast']);

Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm']);
Route::get('/reservations/{id}/bill', [ReservationController::class, 'getBill']);
Route::apiResource('reservations', ReservationController::class);
