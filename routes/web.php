<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-pusher', function () {
    event(new \App\Events\TestEvent('Hello from host!'));
    return "Event Broadcasted!";
});

Route::get('/{any?}', function () {

    return view('welcome');
})->where('any', '^(?!api).*$');
