# Calendar-bookings module

Layered rewrite of `controller/calendarBookingController.js` +
`routes/calendarbooking.js`. Mounted at `/api/calendarbooking`.

`CalendarBooking` is the third copy of the booking record (alongside
`Booking` and `BookingDetail`) that drives the vendor-side calendar
drag-drop UI. Status values are PascalCase here (`Confirmed`,
`Checked-in`, `Checked-out`, `Cancelled`) — distinct from the bookings
module's lowercase set, preserved because clients render the colors
keyed off these literals.

## Endpoints

| Method   | Path                               | Purpose                                                                                                                                 |
| -------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/calendarbooking`             | Paginated list, blends CalendarBooking + BookingDetail + Booking. Filters: `month`, `year`, `vendorId`, `vendorEmail`, plus pagination. |
| `GET`    | `/api/calendarbooking/resources`   | Aggregate stats per resourceName.                                                                                                       |
| `GET`    | `/api/calendarbooking/:id`         | Fetch one.                                                                                                                              |
| `POST`   | `/api/calendarbooking`             | Create. **Conflict-detected** against existing rows on the same resourceName.                                                           |
| `PUT`    | `/api/calendarbooking/:id`         | Partial update; re-runs conflict detection if dates change.                                                                             |
| `PATCH`  | `/api/calendarbooking/:id/dates`   | Drag-drop reschedule with conflict detection; saves `originalDates` for undo.                                                           |
| `PATCH`  | `/api/calendarbooking/:id/status`  | Status change; auto-stamps `checkInTime` / `checkOutTime`.                                                                              |
| `DELETE` | `/api/calendarbooking/:id`         | Delete.                                                                                                                                 |
| `GET`    | `/api/calendarbooking/:id/invoice` | Build invoice payload (legacy: not a real PDF).                                                                                         |

## Cleanups vs the legacy controller

- Mass-assignment killed: `new CalendarBooking(req.body)` → strict zod
  whitelist on every write endpoint.
- Status enum validated up front (was a string-literal `if/else` chain).
- Date-range guards (`start <= end`) lifted into DTO `.refine()` so they
  fire before the service touches Mongo.
- Old commented-out "OLD CODE" block dropped.
- `console.log` / `console.error` → structured pino logger.
- Conflict-detection logic preserved verbatim across create / update /
  setDates.
- The list-blender (CalendarBooking + BookingDetail + Booking) is
  unchanged; vendor scoping rules and the month-window overlap semantics
  match the legacy controller exactly.
