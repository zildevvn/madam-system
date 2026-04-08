<?php

namespace App\Services;

use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\CapabilityProfile;
use Illuminate\Support\Facades\Log;

class PrintService
{
    /**
     * Print a beverage bill to a network thermal printer.
     */
    public function printDrinkBill($order, $title = "")
    {
        $ip = env('PRINTER_DRINK_IP', '192.168.1.100');
        $port = env('PRINTER_DRINK_PORT', 9100);

        try {
            $connector = new NetworkPrintConnector($ip, $port, 3); // 3 second timeout
            $printer = new Printer($connector);

            // Set character encoding to handle Vietnamese (if profile supports it)
            // For now, we'll try to keep it simple or use UTF-8 if possible
            
            // Header: Title
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
            $printer->text($title . "\n");
            $printer->feed();

            // Meta info
            $printer->selectPrintMode(Printer::MODE_FONT_A);
            $printer->setEmphasis(true);
            $tableText = str_replace('Bàn ', '', $order->table->name ?? $order->table_id);
            $printer->text("BAN: " . $tableText . "\n");
            $printer->setEmphasis(false);
            
            $printer->text("Gio in: " . now()->format('H:i d/m/Y') . "\n");
            $printer->text(str_repeat("-", 32) . "\n");

            // Items Table
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            foreach ($order->items as $item) {
                if ($item->product->type !== 'drink') continue;

                $printer->setEmphasis(true);
                $printer->text($item->product->name . "\n");
                $printer->setEmphasis(false);
                
                // Quantity and layout
                $printer->text("SL: " . $item->quantity . "\n");
                
                if ($item->note) {
                    $printer->text("- " . $item->note . "\n");
                }
                $printer->text(str_repeat("-", 32) . "\n");
            }

            // Footer
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->feed(2);
            $printer->text("MADAM SYSTEM - BAR SLIP\n");
            
            // Cut and close
            $printer->cut();
            $printer->close();

            return true;
        } catch (\Exception $e) {
            Log::error("Printing failed: " . $e->getMessage());
            return false;
        }
    }
}
