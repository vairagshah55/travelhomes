# Bookings module

Full layered surface — reads + writes. Mounted at `/api/bookings` and
`/api/admin/bookings`. The legacy `controller/bookingController.js` and
`routes/bookings.js` have been deleted.

## Endpoints

| Method   | Path                            | Auth                     | Purpose                                                                                             |
| -------- | ------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/bookings?date=YYYY-MM-DD` | public                   | List bookings whose `date` falls inside the given UTC day.                                          |
| `GET`    | `/api/bookings/:id`             | public                   | Fetch one booking by ObjectId.                                                                      |
| `GET`    | `/api/bookings/user/:userId`    | JWT (matching `:userId`) | List a user's bookings with `serviceId` populated + `serviceDetails` (cover + gallery photos).      |
| `GET`    | `/api/bookings/legacy/all`      | public                   | Admin filter view (tab / serviceType / search / sortBy / sortDir).                                  |
| `POST`   | `/api/bookings`                 | public                   | Create a booking. Strict zod whitelist on body — server-controlled fields cannot be set by clients. |
| `PUT`    | `/api/bookings/:id`             | public                   | Update a booking (partial).                                                                         |
| `DELETE` | `/api/bookings/:id`             | public                   | Delete a booking.                                                                                   |
| `PATCH`  | `/api/bookings/:id/status`      | public                   | Status change. Fires the confirmation workflow if newly `confirmed`.                                |
| `PATCH`  | `/api/bookings/:id/dates`       | public                   | Calendar drag-drop reschedule. Preserves legacy field names (`date`, `endDate`).                    |
| `POST`   | `/api/bookings/:id/invoice`     | public                   | Build an invoice payload (legacy behavior; not a real PDF).                                         |

## Mass-assignment fix

The legacy `createBooking` did `Booking.create(req.body)` — meaning a client
could set `bookingId`, `confirmationSent`, `invoiceGenerated`, `cancelledAt`,
or any other server-controlled field. The new DTO whitelists only the fields
clients are supposed to send; everything else is rejected with `422`.

## Confirmation workflow

When a booking transitions into `confirmed`:

1. Generate a PDF invoice (`InvoiceGenerator.generateInvoice`).
2. Save the PDF to the local filesystem (`saveInvoiceToFile`).
3. Email the invoice to `clientEmail` via `lib/email-sender/sender.sendEmail`.
4. Persist `invoiceGenerated`, `invoicePath`, `confirmationSent`,
   `confirmationSentAt` on the Booking.

Failures inside this workflow are **logged and swallowed** — they don't fail
the booking response. The legacy controller had the same policy.

## Pending — sibling models

These two models remain in legacy controllers because migrating them without
the payment-saga rewrite would just paper over a real bug:

- **`bookingDetails`** (`controller/bookingDetailsController.js` +
  `routes/bookingDetails.js`) — denormalised duplicate of Booking, created
  alongside the canonical Booking inside `razorPaymentVerify`.
- **`calendarbooking`** (`controller/calendarBookingController.js` +
  `routes/calendarbooking.js`) — third copy for the calendar UI.

The Phase 0 audit flagged that all three documents are created in
`razorPaymentVerify` with no transaction. A real fix wraps that in a MongoDB
transaction (replica set required) or a saga with compensation. That work
lands together with the payments module migration.

## Authorisation gap (carried forward)

Most legacy booking endpoints had no auth gate. We preserved that contract
to avoid a behavior change in this migration. **`/user/:userId` is the only
protected endpoint.** Tightening this is part of the Phase 4 RBAC sweep.
