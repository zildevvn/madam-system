<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$route = Illuminate\Support\Facades\Route::post('/test-middleware', function (Illuminate\Http\Request $request) {
    return response()->json(['data' => $request->all()]);
})->middleware('api');
$request = Illuminate\Http\Request::create('/test-middleware', 'POST', ['test_field' => '']);
$response = $kernel->handle($request);
echo $response->getContent();
