# 📘 Coding Conventions & Best Practices (Final 2026)

# 🎯 Goals
- Tránh N+1 queries  
- Tối ưu cho 100–200 concurrent users  
- Code clean, dễ maintain & scale  
- State management rõ ràng với Redux Toolkit  
- Realtime đồng bộ (Kitchen / Bar / Cashier)  
- Giảm bug từ re-render & side effects  

# 🧠 Backend (Laravel)

## Eager Loading (REQUIRED)
Order::with(['table', 'items.product'])->get();  
Không dùng lazy loading trong production  

## No Queries Inside Loops
❌ foreach ($ids as $id) { Product::find($id); }  
✅ Product::whereIn('id', $ids)->get();

## Select Only Required Fields
Product::select('id', 'name', 'price')->get();

## Database Indexing
- order_id  
- product_id  
- table_id  
- status  

## Service Layer
public function store(OrderRequest $request) {
    return $this->orderService->create($request->validated());
}

Controller mỏng, logic nằm ở Service

## API Response
return response()->json([
  'data' => $data,
  'message' => 'Success',
  'errors' => null
]);

## Order Domain
orders = master  
order_items = detail  
Không update toàn bộ order khi update item  
Status: pending / preparing / done  

## Realtime
event(new NewOrderCreated($order));  
Payload minimal, không gửi full object  

## Cache
Cache: menu, product list  
Không cache realtime data  

## Clean Architecture
Controller mỏng  
Logic ở Service  

# ⚛️ Frontend (React + Redux Toolkit)

## State Structure
store = {
  auth,
  cart,
  orders,
  realtime,
  ui
}

## Normalize State (REQUIRED)
orders = {
  byId: {},
  allIds: []
}

## Selector
const selectOrders = (state) =>
  state.orders.allIds.map(id => state.orders.byId[id]);

## Memoized Selector
createSelector(
  state => state.cart.items,
  items => items.reduce((t, i) => t + i.price, 0)
);

## Avoid Re-render
❌ useSelector(state => state)  
✅ useSelector(state => state.orders)

## Realtime
socket.on('new-order', (data) => {
  dispatch(addOrder(data));
});

Không dùng useState cho realtime

## API Layer
export const createOrder = (data) =>
  axios.post('/orders', data);

## Cart Rule
Lưu Redux local  
Submit mới call API  

## Avoid Redux Abuse
Không dùng Redux cho modal/input/toggle  

## useEffect Rule
- Đúng dependency  
- Không infinite loop  
- Không logic thuần  

## Component Rule
- 1 component = 1 responsibility  
- >200 dòng → tách  
- Tách UI và logic  

## Performance
React.memo  
useMemo  
useCallback  

## Clean Code
Không code dư, không biến thừa  

# 📁 File Naming Conventions

## Rules
- English only  
- Không viết tắt khó hiểu  
- Không generic  

## Frontend
OrderList.tsx  
CartSummary.tsx  
useCart.ts  
orderSlice.ts  
orderApi.ts  
orderSelectors.ts  

## Backend
OrderService.php  
OrderController.php  
StoreOrderRequest.php  
NewOrderCreated.php  

# ♻️ Shared Files Rules

## ❌ Wrong
utils.ts  
helpers.js  
common.ts  

## ✅ Correct
formatCurrency.ts  
calculateOrderTotal.ts  
validateOrder.ts  

useDebounce.ts  
usePagination.ts  

AppModal.tsx  
ConfirmDialog.tsx  

orderStatus.ts  
roles.ts  

order.types.ts  
user.types.ts  

## Structure
/shared
  /utils
  /hooks
  /components
  /constants

## Rule
Không tạo god file  
>300 dòng → tách nhỏ  

# 📝 Comment Rules

- Comment WHY, không phải WHAT  
- Business logic phải có comment  
- Format:
WHY / RULE / NOTE / TODO / FIXME  

# 🔄 Realtime Architecture

Client → API → DB → Event → Socket → Redux → UI  

Channels:
- kitchen  
- bar  

Rule:
- Payload minimal  
- Không gửi full object  

# 👥 Role Rules

Waiter: draft → pending  
Kitchen/Bar: update order_items  
Cashier: completed + release table  
Admin: role middleware  

# 🚀 Performance

Backend:
- Eager loading  
- Index DB  
- No loop query  

Frontend:
- Normalize state  
- Memo selector  
- Avoid re-render  

Realtime:
- Redux only  
- Flow chuẩn  

# ✅ Checklist

Backend:
[ ] Eager loading  
[ ] No loop query  
[ ] Index DB  
[ ] Service layer  

Frontend:
[ ] Normalize state  
[ ] Selector + memo  
[ ] No re-render  
[ ] Clean component  

Realtime:
[ ] Flow đúng  
[ ] Redux update  

# 💡 KEY TAKEAWAY

Backend: query ít + đúng  
Frontend: render ít + rõ state  
Realtime: data nhỏ + sync chuẩn  
Code: clean + dễ hiểu + không dư