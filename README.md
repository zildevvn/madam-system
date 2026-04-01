# 📘 Coding Conventions & Best Practices (Final 2026)

---

# 🎯 Goals

* Tránh N+1 queries
* Tối ưu cho 100–200 concurrent users
* Code clean, dễ maintain & scale
* State management rõ ràng với Redux Toolkit
* Realtime đồng bộ (Kitchen / Bar / Cashier)
* Giảm bug từ re-render & side effects

---

# 🧠 Backend (Laravel)

## 1. Eager Loading (REQUIRED)

```php
Order::with(['table', 'items.product'])->get();
```

❗ Rule:

* Không dùng lazy loading trong production
* Nested relationship phải explicit

---

## 2. No Queries Inside Loops

❌ Bad:

```php
foreach ($ids as $id) {
    Product::find($id);
}
```

✅ Good:

```php
Product::whereIn('id', $ids)->get();
```

---

## 3. Select Only Required Fields

```php
Product::select('id', 'name', 'price')->get();
```

❗ Tránh:

* `select *`
* trả về data dư thừa

---

## 4. Database Indexing (REQUIRED)

* `order_id`
* `product_id`
* `table_id`
* `status`

---

## 5. Service Layer Architecture (REQUIRED)

```php
public function store(OrderRequest $request) {
    return $this->orderService->create($request->validated());
}
```

❗ Rule:

* Controller phải mỏng
* Business logic nằm ở Service

---

## 6. API Response Standard

```php
return response()->json([
    'data' => $data,
    'message' => 'Success',
    'errors' => null
]);
```

---

## 7. Order Domain Rules

* `orders` = master
* `order_items` = chi tiết

❗ Rule:

* Không update toàn bộ order khi update 1 item
* Track status từng item:

  * `pending`
  * `preparing`
  * `done`

---

## 8. Realtime Broadcasting Rules

```php
event(new NewOrderCreated($order));
```

❗ Rule:

* Payload minimal
* Không broadcast dư data

---

## 9. Caching Strategy

* Dùng Redis cho:

  * menu
  * product list

❗ Không cache realtime data

---

## 10. Avoid Fat Models & Controllers

* Không business logic trong Controller
* Không logic phức tạp trong Model

---

# ⚛️ Frontend (React + Redux Toolkit)

## 1. State Structure

```js
store = {
  auth,
  cart,
  orders,
  realtime,
  ui
}
```

---

## 2. Normalize State (REQUIRED)

❌ Bad:

```js
orders: [{ items: [{ product: {...} }] }]
```

✅ Good:

```js
orders: {
  byId: {},
  allIds: []
}
```

---

## 3. Use Selectors

```js
const selectOrders = (state) =>
  state.orders.allIds.map(id => state.orders.byId[id])
```

---

## 4. Memoized Selectors

```js
import { createSelector } from '@reduxjs/toolkit'

const selectCartTotal = createSelector(
  state => state.cart.items,
  items => items.reduce((total, item) => total + item.price, 0)
)
```

---

## 5. Prevent Unnecessary Re-renders

❌ Bad:

```js
useSelector(state => state)
```

✅ Good:

```js
useSelector(state => state.orders)
```

---

## 6. Realtime State Handling

```js
socket.on('new-order', (data) => {
  dispatch(addOrder(data))
})
```

❗ Rule:

* Không dùng `useState` cho realtime

---

## 7. API Layer Separation

```js
export const createOrder = (data) => axios.post('/orders', data)
```

---

## 8. Cart Handling Rule

* Lưu local (Redux)
* Submit mới gửi server

---

## 9. Avoid Overusing Redux

❌ Không dùng Redux cho:

* modal
* input
* toggle

---

## 10. useEffect Rules (CRITICAL)

❗ Rule:

* Dependency phải đầy đủ
* Không dùng cho logic thuần
* Không gây infinite loop

---

## 11. Component Design Rules

❗ Rule:

* 1 component = 1 responsibility
* > 200 dòng → tách component
* Tách UI và logic (custom hook)

---

## 12. Performance Optimization

* `React.memo`
* `useMemo`
* `useCallback`
* Lazy loading

---

## 13. Remove Unused Variables / Imports (REQUIRED)

❗ Rule:

* Không được để:

  * biến không dùng
  * function không dùng
  * import thừa

---

### ❌ Bad

```js
const total = 100
const handleClick = () => {}

import axios from 'axios'
```

---

### ✅ Good

```js
const total = calculateTotal(items)
```

---

### 🛠️ ESLint

```json
{
  "rules": {
    "no-unused-vars": "error"
  }
}
```

---

# 🔄 Realtime Architecture Rules

## Flow

1. Client → request
2. Server → xử lý + lưu DB
3. Server → emit event
4. Client → nhận socket
5. Redux → update UI

---

## Channel Separation

* `kitchen` → món ăn
* `bar` → đồ uống

---

## Event Rules

* Payload minimal
* Không gửi full object nếu không cần

---

# 👥 Role-Based Development Rules

## 1. Waiter (Phục vụ / Order)
- **Status Lifecycle**: Mọi order mới phải bắt đầu bằng status `draft`.
- **Table Integrity**: Luôn kiểm tra tính khả dụng của bàn (`available`) trước khi tạo order.
- **Checkout Trigger**: Chuyển từ `draft` sang `pending` phải thông qua Service layer để đảm bảo tính toán `total_price` và cập nhật trạng thái bàn (`busy`).

---

## 2. Kitchen & Bar (Bếp / Pha chế)
- **Item-Level Control**: Tuyệt đối không update trực tiếp status của `Order`. Chỉ update status của từng `OrderItem` (`pending` -> `cooking` -> `ready` -> `served`).
- **Domain Separation**:
  - `Kitchen`: Chỉ xử lý các item có `category_id` thuộc nhóm món ăn.
  - `Bar`: Chỉ xử lý các item có `category_id` thuộc nhóm đồ uống.
- **Real-time**: Mỗi thay đổi status phải trigger broadcast với payload tối giản lên channel tương ứng (`kitchen` hoặc `bar`).

---

## 3. Cashier & Admin (Thu ngân / Quản lý)
- **Finality**: Chuyển order sang `completed` chỉ sau khi xác nhận thanh toán thành công.
- **Table Release**: Đảm bảo trạng thái bàn được set về `available` ngay sau khi hoàn tất thanh toán.
- **Security**: Các route quản lý (Thêm/Xóa/Sửa sản phẩm/bàn) phải được bảo vệ nghiêm ngặt bằng middleware `role:admin`.

---

# 🚀 Performance Best Practices

## Backend

* Eager loading
* No query in loop
* Index DB
* Cache Redis

---

## Frontend

* Normalize state
* Memo selector
* Tránh re-render
* Lazy load

---

## Realtime

* Redux only
* Không update trực tiếp component state

---

# ✅ Checklist

## Backend

* [ ] Eager loading (`with`)
* [ ] Không query trong loop
* [ ] Có index DB
* [ ] Service layer

---

## Frontend

* [ ] Normalized state
* [ ] Selector + memo
* [ ] Không re-render thừa
* [ ] API tách riêng
* [ ] useEffect đúng
* [ ] Không có unused code

---

## Realtime

* [ ] Event đúng flow
* [ ] Redux update
* [ ] Channel tách riêng

---

## 👥 Role Logic

* [ ] Waiter: Kiểm tra table status & draft flow
* [ ] Kitchen/Bar: Item-level status update & Separation
* [ ] Cashier: Payment -> Completed -> Release table
* [ ] Admin: Middleware protection checks

---

# 💡 KEY TAKEAWAY

* Backend: Query ít + đúng + nhẹ
* Frontend: State rõ + render ít
* Realtime: Data tối thiểu + flow chuẩn
* Code: Clean + không dư thừa

---