# 📘 Coding Conventions & Best Practices

## 🎯 Goals

* Avoid redundant queries (N+1)
* Optimize performance for 100–200 concurrent users
* Maintain clean, scalable codebase
* Manage state efficiently with Redux Toolkit
* Ensure real-time consistency (Kitchen / Bar / Cashier)

---

# 🧠 Backend (Laravel)

## 1. Eager Loading (REQUIRED)

Always load relationships explicitly to avoid N+1 queries.

```php
Order::with(['table', 'items.product'])->get();
```

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

---

## 4. Database Indexing (REQUIRED)

Add indexes to frequently queried columns:

* `order_id`
* `product_id`
* `table_id`
* `status`

---

## 5. Service Layer Architecture

Controllers must remain thin.
Business logic belongs in Services.

```php
public function store(OrderRequest $request) {
    return $this->orderService->create($request->validated());
}
```

---

## 6. API Response Standard

Always return consistent structure:

```php
return response()->json([
    'data' => $data,
    'message' => 'Success'
]);
```

---

## 7. Order Domain Rules

* `orders` = master record
* `order_items` = individual items
* Never update entire order when updating a single item
* Always track item-level status (`pending`, `preparing`, `done`)

---

## 8. Realtime Broadcasting Rules

* Do not broadcast unnecessary data
* Use events for all realtime updates
* Keep payload minimal

```php
event(new NewOrderCreated($order));
```

---

## 9. Avoid Fat Models & Controllers

* No business logic inside Controllers
* No complex logic inside Models
* Use Service / Action classes

---

# ⚛️ Frontend (React + Redux Toolkit)

## 1. State Structure

```js
store = {
  cart,
  orders,
  auth,
  realtime
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

* Never use `useState` for realtime data
* Always dispatch to Redux

```js
socket.on('new-order', (data) => {
  dispatch(addOrder(data))
})
```

---

## 7. API Layer Separation

All API calls must be isolated:

```js
// services/orderService.js
export const createOrder = (data) => axios.post('/orders', data)
```

---

## 8. Cart Handling Rule

* Store locally (Redux)
* Send to server only when submitting order

---

## 9. Avoid Overusing Redux

Do NOT use Redux for:

* UI state (modal, input, toggle)

Use `useState` instead.

---

# 🔄 Realtime Architecture Rules

## Flow

1. Client sends request
2. Server processes & stores data
3. Server emits event
4. Clients receive via WebSocket
5. Redux updates UI

---

## Channel Separation

* `kitchen` → food items only
* `bar` → drink items only

---

## Event Rules

* Keep payload minimal
* Broadcast only necessary data
* Avoid sending full objects if not needed

---

# 🚀 Performance Best Practices

## Backend

* Use eager loading
* Avoid query in loops
* Add proper indexes
* Use caching if needed (Redis)

---

## Frontend

* Normalize Redux state
* Use memoized selectors
* Avoid unnecessary renders
* Use lazy loading when needed

---

## Realtime

* Dispatch Redux actions only
* Avoid direct component state updates

---

# ✅ Checklist

### Backend

* [ ] Using eager loading (`with`)
* [ ] No queries inside loops
* [ ] Indexed database columns
* [ ] Service layer implemented

### Frontend

* [ ] Normalized Redux state
* [ ] Using selectors
* [ ] Avoiding unnecessary re-renders
* [ ] API separated into services

### Realtime

* [ ] Events implemented correctly
* [ ] Redux used for updates
* [ ] Channels separated (kitchen / bar)
