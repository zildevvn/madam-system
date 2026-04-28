<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;

use App\Http\Controllers\API\OrderController;

Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);
Route::put('/tables/{id}', [TableController::class, 'update']);
Route::delete('/tables/{id}', [TableController::class, 'destroy']);

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
Route::patch('/orders/{id}/note', [OrderController::class, 'updateOrderNote']);
Route::patch('/orders/{id}/guest-count', [OrderController::class, 'updateGuestCount']);
Route::post('/orders/{id}/print-drinks', [OrderController::class, 'printDrinkBill']);
Route::put('/order-items/{itemId}/status', [OrderController::class, 'updateItemStatus']);

use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ProductController;

use App\Http\Controllers\API\CategoryController;

Route::post('/login', [UserController::class, 'login']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

use App\Http\Controllers\API\DebugController;
use App\Http\Controllers\API\ReservationController;

use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\StatsController;

Route::get('/debug/printer', [DebugController::class, 'checkPrinter']);
Route::get('/debug/broadcast', [DebugController::class, 'sendTestBroadcast']);

Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm']);
Route::get('/reservations/{id}/bill', [ReservationController::class, 'getBill']);
Route::apiResource('reservations', ReservationController::class);

Route::apiResource('expenses', ExpenseController::class);

Route::get('/stats/today-revenue', [StatsController::class, 'todayRevenue']);
Route::get('/stats/revenue-report', [StatsController::class, 'revenueReport']);
