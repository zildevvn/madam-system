# 📘 Coding Conventions & Best Practices (Final 2026)

---

# 🎯 Goals

- Tránh N+1 queries
- Tối ưu cho 100–200 concurrent users
- Code clean, dễ maintain & scale
- State management rõ ràng với Redux Toolkit
- Realtime đồng bộ (Kitchen / Bar / Cashier)
- Giảm bug từ re-render & side effects

---

# 🧠 Backend (Laravel)

## 1. Eager Loading (REQUIRED)

Order::with(['table', 'items.product'])->get();

Rule:
- Không dùng lazy loading trong production
- Nested relationship phải explicit

---

## 2. No Queries Inside Loops

Bad:
foreach ($ids as $id) {
    Product::find($id);
}

Good:
Product::whereIn('id', $ids)->get();

---

## 3. Select Only Required Fields

Product::select('id', 'name', 'price')->get();

Tránh:
- select *
- trả về data dư thừa

---

## 4. Database Indexing (REQUIRED)

- order_id
- product_id
- table_id
- status

---

## 5. Service Layer Architecture (REQUIRED)

public function store(OrderRequest $request) {
    return $this->orderService->create($request->validated());
}

Rule:
- Controller phải mỏng
- Business logic nằm ở Service

---

## 6. API Response Standard

return response()->json([
    'data' => $data,
    'message' => 'Success',
    'errors' => null
]);

---

## 7. Order Domain Rules

- orders = master
- order_items = chi tiết

Rule:
- Không update toàn bộ order khi update 1 item
- Track status từng item:
  - pending
  - preparing
  - done

---

## 8. Realtime Broadcasting Rules

event(new NewOrderCreated($order));

Rule:
- Payload minimal
- Không broadcast dư data

---

## 9. Caching Strategy

- Redis cho:
  - menu
  - product list

Không cache realtime data

---

## 10. Avoid Fat Models & Controllers

- Không business logic trong Controller
- Không logic phức tạp trong Model

---

# ⚛️ Frontend (React + Redux Toolkit)

## 1. State Structure

store = {
  auth,
  cart,
  orders,
  realtime,
  ui
}

---

## 2. Normalize State (REQUIRED)

Bad:
orders: [{ items: [{ product: {...} }] }]

Good:
orders: {
  byId: {},
  allIds: []
}

---

## 3. Use Selectors

const selectOrders = (state) =>
  state.orders.allIds.map(id => state.orders.byId[id])

---

## 4. Memoized Selectors

const selectCartTotal = createSelector(
  state => state.cart.items,
  items => items.reduce((total, item) => total + item.price, 0)
)

---

## 5. Prevent Unnecessary Re-renders

Bad:
useSelector(state => state)

Good:
useSelector(state => state.orders)

---

## 6. Realtime State Handling

socket.on('new-order', (data) => {
  dispatch(addOrder(data))
})

Rule:
- Không dùng useState cho realtime

---

## 7. API Layer Separation

export const createOrder = (data) => axios.post('/orders', data)

---

## 8. Cart Handling Rule

- Lưu local (Redux)
- Submit mới gửi server

---

## 9. Avoid Overusing Redux

Không dùng Redux cho:
- modal
- input
- toggle

---

## 10. useEffect Rules (CRITICAL)

- Dependency phải đầy đủ
- Không dùng cho logic thuần
- Không gây infinite loop

---

## 11. Component Design Rules

- 1 component = 1 responsibility
- > 200 dòng → tách component
- Tách UI và logic (custom hook)

---

## 12. Performance Optimization

- React.memo
- useMemo
- useCallback
- Lazy loading

---

## 13. Remove Unused Variables / Imports (REQUIRED)

Rule:
- Không được để:
  - biến không dùng
  - function không dùng
  - import thừa

---

# 📝 Code Commenting Rules (REQUIRED)

## Mục tiêu

- Giúp dev hiểu nhanh logic
- Giảm onboarding time
- Tránh hiểu sai business logic
- Debug nhanh hơn

---

## 1. Comment WHY, không phải WHAT

Bad:
// tăng i lên 1
i++

Good:
// tăng index để skip item đã được xử lý từ trước
i++

---

## 2. Comment Business Logic

// Nếu order là draft → chưa tính tiền
// Chỉ khi pending mới tính total
if (order.status === 'pending') {
  calculateTotal(order)
}

---

## 3. Comment Service Layer (BẮT BUỘC)

// Tạo order:
// - Check table available
// - Set draft
// - Chưa tính total
public function create(array $data)

---

## 4. Comment logic khó / dễ bug

// ⚠️ Không dùng Promise.all vì phụ thuộc thứ tự
await processSequentially(items)

---

## 5. Tránh over-comment

Bad:
// khai báo biến
const name = 'John'

---

## 6. Format chuẩn

// [WHY]
// [RULE]
// [NOTE]
// [TODO]
// [FIXME]

---

## 7. TODO / FIXME

// TODO: optimize query (đang N+1)

---

## 8. Không comment sai

Bad:
// check admin
if (user.role === 'staff')

---

## 9. Self-documenting code

Bad:
const t = calc(o)

Good:
const totalPrice = calculateOrderTotal(order)

---

## 10. Comment Realtime Flow

// nhận socket → update Redux
// không update local state
socket.on('order-updated', ...)

---

# 🔄 Realtime Architecture Rules

Flow:
1. Client → request
2. Server → DB
3. Server → event
4. Client → socket
5. Redux → UI

---

## Channel

- kitchen → món ăn
- bar → đồ uống

---

## Event Rule

- Payload minimal
- Không gửi full object

---

# 👥 Role-Based Development Rules

## Waiter

- Order = draft
- Check table available
- Submit → pending + tính total

---

## Kitchen / Bar

- Chỉ update OrderItem
- Không update Order

---

## Cashier

- Pay → completed
- Release table

---

## Admin

- Protect bằng middleware role:admin

---

# 🚀 Performance

Backend:
- Eager loading
- No loop query
- Index DB
- Cache Redis

Frontend:
- Normalize state
- Memo selector
- Tránh re-render

Realtime:
- Redux only
- Flow chuẩn

---

# ✅ Checklist

Backend:
[ ] Eager loading
[ ] No loop query
[ ] Index DB
[ ] Service layer

Frontend:
[ ] Normalize state
[ ] Selector + memo
[ ] No re-render thừa
[ ] API riêng
[ ] useEffect đúng
[ ] Không code dư

Realtime:
[ ] Flow đúng
[ ] Redux update
[ ] Channel tách

Role:
[ ] Waiter đúng flow
[ ] Kitchen/Bar item-level
[ ] Cashier release table
[ ] Admin protected

---

# 💡 KEY TAKEAWAY

Backend: Query ít + đúng + nhẹ
Frontend: State rõ + render ít
Realtime: Data tối thiểu + flow chuẩn
Code: Clean + không dư + comment rõ