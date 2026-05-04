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
| `POST`   | `/api/payments/razor/create-order`   | none                                                   | Create a Razorpay order.                                                                                                                                  |
| `POST`   | `/api/payments/razor/verify-payment` | none (HMAC-checked)                                    | Verify the payment + create Booking, BookingDetail, CalendarBooking, Payment **as a saga** — see below.                                                   |

## The Razorpay verify saga (the bug we came here to fix)

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
  `{ success, data }` — clients depend on the raw shape.
