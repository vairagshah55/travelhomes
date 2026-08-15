# Payments module

Layered rewrite of `controller/paymentController.js` + `routes/payments.js`.
Mounted at `/api/payments` and `/api/admin/payments`.

## Endpoints

| Method   | Path                                 | Auth                                                   | Purpose                                                                                                                                                   |
| -------- | ------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/payments`                      | optional JWT (controller-enforced for non-vendor tabs) | List payments — supports `tab=vendor`/`payment-received`/`refund-status`, plus search/sort/category filters. Vendors are auto-scoped to their own offers. |
| `GET`    | `/api/payments/:id`                  | optional JWT                                           | Fetch one payment.                                                                                                                                        |
| `POST`   | `/api/payments`                      | none                                                   | Create a payment record. **Strict zod whitelist** — kills the legacy `Payment.create(req.body)` mass-assignment.                                          |
| `PUT`    | `/api/payments/:id`                  | optional JWT                                           | Partial update with the same whitelist.                                                                                                                   |
| `DELETE` | `/api/payments/:id`                  | optional JWT                                           | Delete.                                                                                                                                                   |
| `PATCH`  | `/api/payments/:id/status`           | optional JWT                                           | Status change (`pending` / `paid` / `requested` / `processing` / `refunded`).                                                                             |
| `GET`    | `/api/payments/gateway`              | none                                                   | Which gateway the checkout should drive, plus the public key it needs. Never returns a secret.                                                             |
| `GET`    | `/api/payments/gateway/settings`     | admin (`manage_payments`)                              | Current selection + every option and whether it has credentials.                                                                                          |
| `PUT`    | `/api/payments/gateway/settings`     | admin (`manage_payments`)                              | Switch the checkout gateway.                                                                                                                              |
| `POST`   | `/api/payments/razor/create-order`   | none                                                   | Create a Razorpay order.                                                                                                                                  |
| `POST`   | `/api/payments/razor/verify-payment` | none (HMAC-checked)                                    | Verify the payment + create Booking, BookingDetail, CalendarBooking, Payment **as a saga** — see below.                                                   |
| `POST`   | `/api/payments/cashfree/create-order`| none                                                   | Create a Cashfree order; returns `payment_session_id` for the browser SDK.                                                                                 |
| `POST`   | `/api/payments/cashfree/verify-payment` | none (confirmed against Cashfree's API)             | Same saga, after asking Cashfree whether the order was actually paid.                                                                                     |

## Two gateways, one saga

Razorpay and Cashfree both run through `createBookingRecords`. They differ in
exactly one respect — **how a payment is proven** — and that difference is not
cosmetic:

| | Razorpay | Cashfree |
| --- | --- | --- |
| What the browser gets | an HMAC signature over `order_id\|payment_id` | nothing it can prove |
| How the server verifies | recomputes the HMAC locally, `timingSafeEqual` | `GET /pg/orders/{id}/payments`, looks for `SUCCESS` |
| Amount check | **none** (see below) | paid amount must match `booking.totalAmount` |
| Replay protection | none | existing `gatewayTransactionId` returns the original booking |

Because Cashfree's browser SDK hands back no signature, trusting the client's
"it worked" would let anyone POST a booking into existence. The verify endpoint
therefore takes only an order id and asks Cashfree what happened.

> **Known gap, Razorpay side.** `verifyRazorpayPayment` proves that *a* payment
> for that order succeeded, but never checks it was for the amount the booking
> blob claims. A client can pay ₹1 and post a ₹50,000 booking. Closing it means
> fetching the order from Razorpay and comparing — the same thing the Cashfree
> path already does.

### Choosing the gateway

`PaymentSetting` (a singleton keyed `"gateway"`) holds the admin's choice;
`PAYMENT_GATEWAY` is the fallback when no admin has picked one. Resolution
skips the DB entirely unless mongoose is connected, and caps the query at 2s —
a settings lookup must never be what makes a checkout hang.

Switching is rejected for a gateway with no credentials configured, so the
failure surfaces in the admin UI rather than to a customer mid-payment.
In-flight payments finish on whichever gateway started them: the two
`create-order` / `verify-payment` pairs stay independently reachable.

Admin UI: **Global Settings → Payments**.

## The verify saga (the bug we came here to fix)

The legacy `razorPaymentVerify` did this on success:

```
new Booking(...)          .save()
new BookingDetail(...)    .save()
new CalendarBooking(...)  .save()
new Payment(...)          .save()
```

No transaction. If any step after the first failed, money was charged on
Razorpay's side but the local DB was left half-populated. We've fixed this
in two ways via [`Server/shared/saga.js`](../../shared/saga.js):

1. **Preferred — MongoDB transaction.** When the deployment is a replica
   set / sharded cluster (Atlas, or a local single-node replica via
   `mongod --replSet rs0`), `runSaga` opens a session and runs all four
   `.save({ session })` calls inside `session.withTransaction(...)`. Any
   thrown error rolls everything back atomically.

2. **Fallback — saga with compensation.** Standalone `mongod` (the default
   dev setup) doesn't support transactions. We detect that specific failure
   mode at runtime, log loudly, and fall back to running each step serially
   with explicit `undo` callbacks. If a later step fails, every completed
   step's `undo` runs in reverse to compensate (e.g. delete the Booking
   that was created before BookingDetail blew up).

The signature check uses `crypto.timingSafeEqual` instead of plain `===`
to prevent timing-side-channel signature recovery.

### Why not require transactions everywhere?

Production _should_ use a replica set — that's the unambiguously correct
answer. But forcing it would break local dev for users running standalone
`mongod`, so the fallback exists as a safety net. **The warning log is
loud on purpose** — operators should see "transactions unsupported" in
their logs and upgrade.

## Other cleanups in the migration

- `process.env.RAZOR_KEY` / `RAZOR_SECRET` reads → validated env module
  with explicit `RAZORPAY_NOT_CONFIGURED` 503 if missing.
- Search input regex-escaped before `new RegExp(...)` (was unescaped in
  the legacy admin filter).
- `console.log/error` → structured pino logger.
- Createpayment `req.body` mass-assignment killed.
- Notifications are fire-and-forget (failures don't fail the create).

## Behavior preserved

- `getPayments` 401 for unauthenticated non-vendor tabs (legacy auth check
  was inline in the controller; preserved as `UnauthorizedError` from the
  service).
- Vendor-payouts `tab=vendor&serviceType=paid` returns `[]` (legacy stub).
- Vendor scoping: vendors can only see payments whose `servicesNames`
  match offers they own.
- Razorpay create-order returns the raw order object, not wrapped in
  `{ success, data }` — clients depend on the raw shape. (The Cashfree
  equivalent is a new endpoint with no legacy callers, so it uses the normal
  `{ success, data }` envelope.)
- `PAYMENT_GATEWAY` defaults to `razorpay`, so a deployment that never sets it
  behaves exactly as it did before Cashfree existed.
