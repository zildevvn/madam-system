<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Table;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Category;
use App\Models\Reservation;
use App\Services\OrderService;
use App\Services\OrderSplitService;
use App\Services\OrderPaymentService;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\SplitOrderRequest;

class SplitOrderCrossOrderValidationTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected OrderSplitService $splitService;
    protected Table $tableA;
    protected Table $tableB;
    protected Table $tableZ;
    protected Category $category;
    protected Product $product1;
    protected Product $product2;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $paymentService = app(OrderPaymentService::class);
        $tableService = app(OrderTableService::class);
        $this->splitService = app(OrderSplitService::class);
        $this->orderService = new OrderService($paymentService, $tableService, $this->splitService);

        $this->tableA = Table::create(['name' => 'Bàn 1', 'status' => 'busy']);
        $this->tableB = Table::create(['name' => 'Bàn 2', 'status' => 'busy']);
        $this->tableZ = Table::create(['name' => 'Bàn 99', 'status' => 'busy']);

        $this->category = Category::create(['name' => 'Drinks', 'type' => 'drink']);
        $this->product1 = Product::create(['name' => 'Coffee', 'price' => 30000, 'category_id' => $this->category->id, 'type' => 'drink']);
        $this->product2 = Product::create(['name' => 'Tea', 'price' => 20000, 'category_id' => $this->category->id, 'type' => 'drink']);

        $this->user = User::factory()->create(['role' => 'cashier']);
    }

    /**
     * Case 1: Đơn nguồn: tách món thành công.
     */
    public function test_split_items_belonging_to_source_order_succeeds()
    {
        $sourceOrder = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'total_price' => 80000,
        ]);

        $item1 = OrderItem::create([
            'order_id' => $sourceOrder->id,
            'product_id' => $this->product1->id,
            'quantity' => 2,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $item2 = OrderItem::create([
            'order_id' => $sourceOrder->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();

        // Tách 1 ly Coffee từ $sourceOrder
        $result = $this->splitService->splitItems($sourceOrder->id, [
            ['order_item_id' => $item1->id, 'quantity' => 1]
        ]);

        // Kiểm tra đơn mới được tạo
        $this->assertEquals($initialOrderCount + 1, Order::count());
        $newOrder = $result['new_order'];
        $this->assertEquals($sourceOrder->id, $newOrder->parent_order_id);
        $this->assertEquals($this->tableA->id, $newOrder->table_id);

        // Kiểm tra item ở đơn nguồn đã giảm số lượng
        $item1->refresh();
        $this->assertEquals(1, $item1->quantity);
        $this->assertEquals($sourceOrder->id, $item1->order_id);

        // Kiểm tra item mới ở đơn đích
        $newItems = OrderItem::where('order_id', $newOrder->id)->get();
        $this->assertCount(1, $newItems);
        $this->assertEquals(1, $newItems->first()->quantity);
        $this->assertEquals($this->product1->id, $newItems->first()->product_id);
    }

    /**
     * Case 2: Đơn hợp lệ cùng nhóm bàn gộp: tách thành công.
     */
    public function test_split_items_belonging_to_merged_table_sibling_order_succeeds()
    {
        $mergedString = $this->tableA->id . '-' . $this->tableB->id;

        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'merged_tables' => $mergedString,
            'total_price' => 30000,
        ]);

        $orderB = Order::create([
            'table_id' => $this->tableB->id,
            'status' => 'pending',
            'merged_tables' => $mergedString,
            'total_price' => 20000,
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $itemB = OrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        // Thao tác tách được gọi từ Order A, chọn tách Item B (thuộc Order B cùng nhóm bàn gộp)
        $result = $this->splitService->splitItems($orderA->id, [
            ['order_item_id' => $itemB->id, 'quantity' => 1]
        ]);

        $newOrder = $result['new_order'];
        $this->assertNotNull($newOrder);

        // Item B được di chuyển sang đơn mới
        $itemB->refresh();
        $this->assertEquals($newOrder->id, $itemB->order_id);

        // Item A vẫn nguyên vẹn ở Order A
        $itemA->refresh();
        $this->assertEquals($orderA->id, $itemA->order_id);
    }

    /**
     * Case 3: Đơn độc lập khác bàn: bị từ chối.
     */
    public function test_split_items_from_unrelated_order_is_rejected()
    {
        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'total_price' => 30000,
        ]);

        $orderZ = Order::create([
            'table_id' => $this->tableZ->id,
            'status' => 'pending',
            'total_price' => 20000,
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $itemZ = OrderItem::create([
            'order_id' => $orderZ->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();
        $initialItemCount = OrderItem::count();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot split an item from an unrelated order.");

        try {
            // Cố ý tách Item Z (của Bàn 99) vào phiên tách của Order A (Bàn 1)
            $this->splitService->splitItems($orderA->id, [
                ['order_item_id' => $itemZ->id, 'quantity' => 1]
            ]);
        } finally {
            // Database không bị tạo đơn mới và không thay đổi dữ liệu
            $this->assertEquals($initialOrderCount, Order::count());
            $this->assertEquals($initialItemCount, OrderItem::count());

            $itemZ->refresh();
            $this->assertEquals($orderZ->id, $itemZ->order_id);
            $this->assertEquals(1, $itemZ->quantity);
        }
    }

    /**
     * Case 4: Đơn độc lập trên một bàn có ID nằm trong merged_tables nhưng không thuộc cùng nhóm: bị từ chối.
     */
    public function test_split_items_from_independent_order_on_table_in_merged_tables_is_rejected()
    {
        $mergedString = $this->tableA->id . '-' . $this->tableB->id;

        // Order A gộp bàn 1 và bàn 2
        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'merged_tables' => $mergedString,
            'total_price' => 30000,
        ]);

        // Order B độc lập trên Bàn 2 (table_id = Bàn 2, nhưng merged_tables là null)
        $orderB_independent = Order::create([
            'table_id' => $this->tableB->id,
            'status' => 'pending',
            'merged_tables' => null,
            'total_price' => 20000,
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $itemB_independent = OrderItem::create([
            'order_id' => $orderB_independent->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();
        $initialItemCount = OrderItem::count();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot split an item from an unrelated order.");

        try {
            // Cố ý tách Item B của đơn độc lập trên Bàn 2 vào phiên tách của Order A
            $this->splitService->splitItems($orderA->id, [
                ['order_item_id' => $itemB_independent->id, 'quantity' => 1]
            ]);
        } finally {
            $this->assertEquals($initialOrderCount, Order::count());
            $this->assertEquals($initialItemCount, OrderItem::count());

            $itemB_independent->refresh();
            $this->assertEquals($orderB_independent->id, $itemB_independent->order_id);
            $this->assertEquals(1, $itemB_independent->quantity);
        }
    }

    /**
     * Case 5a: Các đơn có chung reservation nhưng không thuộc cùng nhóm nghiệp vụ (individual reservation): bị từ chối.
     */
    public function test_split_items_from_orders_sharing_individual_reservation_is_rejected()
    {
        $individualReservation = Reservation::create([
            'type' => 'individual',
            'table_ids' => [$this->tableA->id, $this->tableB->id],
            'lead_name' => 'Individual Guest',
            'phone' => '0901234567',
            'reservation_date' => '2026-10-15',
            'reservation_time' => '18:00:00',
            'status' => 'confirmed'
        ]);

        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'reservation_id' => $individualReservation->id,
            'status' => 'pending',
            'total_price' => 30000,
        ]);

        $orderB = Order::create([
            'table_id' => $this->tableB->id,
            'reservation_id' => $individualReservation->id,
            'status' => 'pending',
            'total_price' => 20000,
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $itemB = OrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot split an item from an unrelated order.");

        try {
            // Không được phép tách món giữa 2 đơn có chung individual reservation
            $this->splitService->splitItems($orderA->id, [
                ['order_item_id' => $itemB->id, 'quantity' => 1]
            ]);
        } finally {
            $this->assertEquals($initialOrderCount, Order::count());
            $itemB->refresh();
            $this->assertEquals($orderB->id, $itemB->order_id);
        }
    }

    /**
     * Case 5b: Các đơn có chung group reservation (quy tắc hiện hành cho phép): tách thành công.
     */
    public function test_split_items_from_orders_sharing_group_reservation_is_allowed()
    {
        $groupReservation = Reservation::create([
            'type' => 'group',
            'table_ids' => [$this->tableA->id, $this->tableB->id],
            'lead_name' => 'Tour Group 1',
            'phone' => '0901234567',
            'reservation_date' => '2026-10-15',
            'reservation_time' => '18:00:00',
            'status' => 'confirmed'
        ]);

        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'reservation_id' => $groupReservation->id,
            'status' => 'pending',
            'total_price' => 30000,
        ]);

        $orderB = Order::create([
            'table_id' => $this->tableB->id,
            'reservation_id' => $groupReservation->id,
            'status' => 'pending',
            'total_price' => 20000,
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $itemB = OrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $result = $this->splitService->splitItems($orderA->id, [
            ['order_item_id' => $itemB->id, 'quantity' => 1]
        ]);

        $newOrder = $result['new_order'];
        $this->assertNotNull($newOrder);

        $itemB->refresh();
        $this->assertEquals($newOrder->id, $itemB->order_id);
    }

    /**
     * Case 6: Cùng một order_item_id xuất hiện hai lần và tổng quantity vượt số lượng thực tế: bị từ chối, database không thay đổi.
     */
    public function test_duplicate_order_item_id_with_excess_total_quantity_is_rejected()
    {
        $order = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'total_price' => 60000,
        ]);

        // Món có số lượng = 2
        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product1->id,
            'quantity' => 2,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();
        $initialItemCount = OrderItem::count();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Split quantity exceeds current item quantity.");

        try {
            // Gửi cùng item_id 2 lần: 2 + 1 = 3 > quantity thực tế (2)
            $this->splitService->splitItems($order->id, [
                ['order_item_id' => $item->id, 'quantity' => 2],
                ['order_item_id' => $item->id, 'quantity' => 1],
            ]);
        } finally {
            $this->assertEquals($initialOrderCount, Order::count());
            $this->assertEquals($initialItemCount, OrderItem::count());

            $item->refresh();
            $this->assertEquals(2, $item->quantity);
            $this->assertEquals($order->id, $item->order_id);
        }
    }

    /**
     * Case 7: Request có nhiều món, trong đó có một món không hợp lệ: transaction rollback toàn bộ.
     */
    public function test_transaction_rolls_back_when_one_item_is_unrelated()
    {
        $orderA = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'total_price' => 60000,
        ]);

        $itemA1 = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->product1->id,
            'quantity' => 2,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $orderZ = Order::create([
            'table_id' => $this->tableZ->id,
            'status' => 'pending',
            'total_price' => 20000,
        ]);

        $itemZ = OrderItem::create([
            'order_id' => $orderZ->id,
            'product_id' => $this->product2->id,
            'quantity' => 1,
            'price' => 20000,
            'status' => 'pending',
        ]);

        $initialOrderCount = Order::count();
        $initialItemCount = OrderItem::count();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot split an item from an unrelated order.");

        try {
            // Món 1 hợp lệ (Item A1), nhưng món 2 không hợp lệ (Item Z)
            $this->splitService->splitItems($orderA->id, [
                ['order_item_id' => $itemA1->id, 'quantity' => 1],
                ['order_item_id' => $itemZ->id, 'quantity' => 1],
            ]);
        } finally {
            // Toàn bộ transaction phải rollback: không có đơn mới, Item A1 không bị trừ số lượng
            $this->assertEquals($initialOrderCount, Order::count());
            $this->assertEquals($initialItemCount, OrderItem::count());

            $itemA1->refresh();
            $this->assertEquals(2, $itemA1->quantity);
            $this->assertEquals($orderA->id, $itemA1->order_id);

            $itemZ->refresh();
            $this->assertEquals(1, $itemZ->quantity);
            $this->assertEquals($orderZ->id, $itemZ->order_id);
        }
    }

    /**
     * Case 8: Đơn đã completed: giữ nguyên hành vi từ chối.
     */
    public function test_split_items_from_completed_order_is_rejected()
    {
        $completedOrder = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'completed',
            'total_price' => 30000,
        ]);

        $item = OrderItem::create([
            'order_id' => $completedOrder->id,
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'price' => 30000,
            'status' => 'completed',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot split a completed order.");

        $this->splitService->splitItems($completedOrder->id, [
            ['order_item_id' => $item->id, 'quantity' => 1]
        ]);
    }

    /**
     * Validation Request: SplitOrderRequest từ chối duplicate item ID và quantity không hợp lệ.
     */
    public function test_split_order_request_validation_rules()
    {
        $order = Order::create([
            'table_id' => $this->tableA->id,
            'status' => 'pending',
            'total_price' => 60000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product1->id,
            'quantity' => 3,
            'price' => 30000,
            'status' => 'pending',
        ]);

        $rules = (new SplitOrderRequest())->rules();

        // 1. Duplicate order_item_id bị từ chối bởi rule 'distinct'
        $validatorDuplicate = Validator::make([
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 1],
                ['order_item_id' => $item->id, 'quantity' => 1],
            ]
        ], $rules);
        $this->assertTrue($validatorDuplicate->fails());
        $this->assertArrayHasKey('items.1.order_item_id', $validatorDuplicate->errors()->toArray());

        // 2. Quantity <= 0 hoặc không phải integer bị từ chối
        $validatorInvalidQty = Validator::make([
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 0],
            ]
        ], $rules);
        $this->assertTrue($validatorInvalidQty->fails());
        $this->assertArrayHasKey('items.0.quantity', $validatorInvalidQty->errors()->toArray());

        // 3. Payload hợp lệ
        $validatorValid = Validator::make([
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 2],
            ]
        ], $rules);
        $this->assertFalse($validatorValid->fails());
    }
}
