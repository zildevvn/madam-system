<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TableController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\LeaveRequestController;
use App\Http\Controllers\API\DebugController;
use App\Http\Controllers\API\ReservationController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\StatsController;
use App\Http\Controllers\API\SystemMessageController;
use App\Http\Controllers\API\PartnerCompanyController;

// Same-domain or stateless API routes
Route::get('/tables', [TableController::class, 'index']);
Route::post('/tables', [TableController::class, 'store']);
Route::put('/tables/{id}', [TableController::class, 'update']);
Route::delete('/tables/{id}', [TableController::class, 'destroy']);

Route::middleware('web')->group(function () {
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
    Route::post('/orders/{id}/split', [OrderController::class, 'split']);
    Route::post('/orders/{id}/print-drinks', [OrderController::class, 'printDrinkBill']);
    Route::post('/orders/{id}/mark-printed', [OrderController::class, 'markPrinted']);
    Route::put('/order-items/{itemId}/status', [OrderController::class, 'updateItemStatus']);
});

// Accounts management
Route::post('/login', [UserController::class, 'login']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

// Leave requests
Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
Route::put('/leave-requests/{id}/status', [LeaveRequestController::class, 'updateStatus']);
Route::delete('/leave-requests/{id}', [LeaveRequestController::class, 'destroy']);

// Attendance Management
Route::get('/attendances', [\App\Http\Controllers\API\AttendanceController::class, 'index']);
Route::post('/attendances', [\App\Http\Controllers\API\AttendanceController::class, 'store']);
Route::delete('/attendances/{id}', [\App\Http\Controllers\API\AttendanceController::class, 'destroy']);
Route::get('/attendances/today-status', [\App\Http\Controllers\API\AttendanceController::class, 'todayStatus']);
Route::post('/attendances/request-checkin', [\App\Http\Controllers\API\AttendanceController::class, 'requestCheckIn']);
Route::post('/attendances/request-checkout', [\App\Http\Controllers\API\AttendanceController::class, 'requestCheckout']);
Route::post('/attendances/{id}/approve', [\App\Http\Controllers\API\AttendanceController::class, 'approveRequest']);
Route::post('/attendances/{id}/reject', [\App\Http\Controllers\API\AttendanceController::class, 'rejectRequest']);

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

// Categories
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// Printer debug tools
Route::get('/debug/printer', [DebugController::class, 'checkPrinter']);
Route::get('/debug/broadcast', [DebugController::class, 'sendTestBroadcast']);

// Reservations
Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm']);
Route::get('/reservations/{id}/bill', [ReservationController::class, 'getBill']);
Route::apiResource('reservations', ReservationController::class);

// Expenses & operational notifications
Route::apiResource('expenses', ExpenseController::class);
Route::apiResource('system-messages', SystemMessageController::class);
Route::post('/system-messages/{id}/read', [SystemMessageController::class, 'markAsRead']);
Route::apiResource('partner-companies', PartnerCompanyController::class);

// Analytics
Route::get('/stats/today-revenue', [StatsController::class, 'todayRevenue']);
Route::get('/stats/revenue-report', [StatsController::class, 'revenueReport']);
Route::get('/stats/item-stats', [StatsController::class, 'itemStats']);
Route::get('/stats/employee-performance', [StatsController::class, 'employeePerformance']);
Route::get('/stats/reservation-stats', [StatsController::class, 'reservationStats']);
