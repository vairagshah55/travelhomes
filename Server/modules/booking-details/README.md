# Booking-details module

Layered rewrite of `controller/bookingDetailsController.js` +
`routes/bookingDetails.js`. Mounted at `/api/bookingDetails`.

`BookingDetail` is a denormalised view of `Booking` that drives the vendor
dashboard. It carries display-shaped fields (formatted dates, statusColor
Tailwind classes). New rows are created alongside `Booking` inside the
Razorpay verify saga ([`modules/payments`](../payments/)).

## Endpoints

| Method   | Path                              | Auth                               | Notes                                                                                                                                         |
| -------- | --------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/bookingDetails`             | optional JWT (controller-enforced) | List. Vendors auto-scoped to their own offers; admins can filter via `?vendorId=...`. Blends `BookingDetail` rows with mapped `Booking` rows. |
| `GET`    | `/api/bookingDetails/:id`         | optional JWT                       | Fetch one. Optional `?vendorId=...` triggers an ownership check.                                                                              |
| `POST`   | `/api/bookingDetails`             | optional JWT                       | Strict whitelist DTO. Auto-populates `vendorId` from the authenticated vendor; auto-derives `statusColor` from `status`.                      |
| `PUT`    | `/api/bookingDetails/:id`         | optional JWT                       | Partial update; re-derives `statusColor` if `status` is in the patch.                                                                         |
| `DELETE` | `/api/bookingDetails/:id`         | optional JWT                       |                                                                                                                                               |
| `POST`   | `/api/bookingDetails/:id/invoice` | optional JWT                       | Builds an invoice payload (legacy: not a real PDF).                                                                                           |

## Cleanups vs the legacy controller

- Mass-assignment killed: `BookingDetail.create(req.body)` → strict zod
  whitelist. `statusColor` is server-derived from `status`, not client-set.
- A latent bug fixed: the legacy admin filter referenced `mongoose` without
  importing it, so a vendorId filter on a non-ObjectId would throw. The
  service now imports mongoose properly.
- `console.log/error` → structured pino logger.
- Vendor scoping logic preserved verbatim (vendorId match + serviceName
  fallback for legacy rows missing vendorId).
- `formatDate` helper extracted (was duplicated twice in the legacy file).
