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

            // Header: Title
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
            $printer->text($this->normalizeText($title) . "\n");
            $printer->feed();

            // Meta info
            $printer->selectPrintMode(Printer::MODE_FONT_A);
            $printer->setEmphasis(true);
            $tableText = str_replace('Bàn ', '', $order->table->name ?? $order->table_id);
            $printer->text("BAN: " . $this->normalizeText($tableText) . "\n");
            $printer->setEmphasis(false);
            
            $printer->text("Gio in: " . now()->format('H:i d/m/Y') . "\n");
            $printer->text(str_repeat("-", 32) . "\n");

            // Items Table
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            foreach ($order->items as $item) {
                if ($item->product->type !== 'drink') continue;

                $printer->setEmphasis(true);
                $printer->text($this->normalizeText($item->product->name) . "\n");
                $printer->setEmphasis(false);
                
                // Quantity and layout
                $printer->text("SL: " . $item->quantity . "\n");
                
                if ($item->note) {
                    $printer->text("- " . $this->normalizeText($item->note) . "\n");
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

    /**
     * Print a minimal diagnostic page to verify hardware connectivity.
     */
    public function printTestPage()
    {
        $ip = env('PRINTER_DRINK_IP', '192.168.1.100');
        $port = env('PRINTER_DRINK_PORT', 9100);

        try {
            $connector = new NetworkPrintConnector($ip, $port, 3);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
            $printer->text("DIAGNOSTIC TEST\n");
            $printer->feed();
            
            $printer->selectPrintMode(Printer::MODE_FONT_A);
            $printer->text("Ket noi: THANH CONG\n");
            $printer->text("Thoi gian: " . now()->format('H:i:s d/m/Y') . "\n");
            $printer->text(str_repeat("-", 32) . "\n");
            $printer->text("MADAM SYSTEM - BAR PRINTER\n");
            
            $printer->feed(3);
            $printer->cut();
            $printer->close();

            return true;
        } catch (\Exception $e) {
            Log::error("Test print failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Remove accents from Vietnamese text for thermal printer compatibility.
     */
    private function normalizeText($text)
    {
        if (!$text) return "";
        
        $unicode = array(
            'a' => 'á|à|ả|ã|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ',
            'd' => 'đ',
            'e' => 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
            'i' => 'í|ì|ỉ|ĩ|ị',
            'o' => 'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
            'u' => 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
            'y' => 'ý|ỳ|ỷ|ỹ|ỵ',
            'A' => 'Á|À|Ả|Ã|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ',
            'D' => 'Đ',
            'E' => 'É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ',
            'I' => 'Í|Ì|Ỉ|Ĩ|Ị',
            'O' => 'Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ',
            'U' => 'Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự',
            'Y' => 'Ý|Ỳ|Ỷ|Ỹ|Ỵ',
        );
        
        foreach ($unicode as $nonUnicode => $uni) {
            $text = preg_replace("/($uni)/i", $nonUnicode, $text);
        }
        
        return $text;
    }
}
