# Bookings module

**Migration in progress.** Reads are layered; writes still live in the legacy
controller. This is intentional — bookings touches the payment saga, so we
move incrementally to keep risk small.

## Endpoints owned

| Method | Path                            | Auth                  | Purpose                                                                                                                            |
| ------ | ------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/bookings?date=YYYY-MM-DD` | public                | List bookings whose `date` falls inside the given UTC day.                                                                         |
| `GET`  | `/api/bookings/:id`             | public                | Fetch one booking by ObjectId.                                                                                                     |
| `GET`  | `/api/bookings/user/:userId`    | JWT (matching userId) | List a user's bookings with `serviceId` populated + a `serviceDetails` shape (cover + gallery photos) the client renders directly. |

## How the co-mount works

In `api/index.js`:

```js
app.use("/api/bookings", bookingsReadRouter); // this module — reads
app.use("/api/bookings", bookingsRoutes); // legacy — writes + everything else
```

Express tries routers in registration order. The reads land here; anything
else (POST / PUT / PATCH / DELETE / `/legacy/all`) falls through to the
legacy router untouched.

## Pending

Still in `controller/bookingController.js` + `routes/bookings.js`:

- `POST /api/bookings` — create (mass-assignment risk: `Booking.create(req.body)`)
- `PUT /api/bookings/:id` — update
- `DELETE /api/bookings/:id` — delete
- `PATCH /api/bookings/:id/status` — status change + admin notifications
- `PATCH /api/bookings/:id/dates` — drag-drop reschedule
- `POST /api/bookings/:id/invoice` — invoice PDF
- `GET /api/bookings/legacy/all` — admin filter view (rich query logic)

Sibling models that deserve their own modules later:

- **`bookingDetails`** (`controller/bookingDetailsController.js` +
  `routes/bookingDetails.js`) — a denormalised duplicate of Booking,
  created in `razorPaymentVerify`. Migrating this without addressing the
  saga would just paper over the partial-failure problem.
- **`calendarbooking`** (`controller/calendarBookingController.js` +
  `routes/calendarbooking.js`) — third copy of the booking record for
  the calendar UI.

The Phase 0 audit flagged that all three documents are created by
`razorPaymentVerify` with no transaction. A real fix wraps that in a
MongoDB transaction (or saga with compensation) — that lands together
with the bookings write migration.
