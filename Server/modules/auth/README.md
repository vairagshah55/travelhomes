# Auth module

Layered structure that the rest of the server is migrating toward:

```
auth.router.js     thin: rate-limit + validate + asyncHandler → controller
auth.controller.js thin: req.validated → service → res.json
auth.service.js    business logic; takes plain DTOs, returns plain data,
                   throws AppError subclasses on domain errors
auth.dto.js        zod schemas; the only place input shapes are defined
__tests__/         vitest + supertest integration tests
```

## Rules

- **Controllers never touch Mongoose.** Every DB call lives in the service.
- **Inputs are validated at the router boundary** with `validate({ body, params, query })`.
  The parsed values land on `req.validated.{body,params,query}`. `req.body`
  is preserved untouched for logging.
- **Errors are thrown, not returned.** Services throw `AppError` subclasses
  from `shared/errors.js`. The central error middleware formats the HTTP
  response.
- **No `res.status(500).json(...)`.** Unhandled errors → `next(err)` (free via
  `asyncHandler`).
- **Side effects that shouldn't fail the request** (email send, notification
  create) are fire-and-forget with a `logger.error` on failure.

## Endpoints (current scope)

| Method  | Path                                | Purpose                                                |
| ------- | ----------------------------------- | ------------------------------------------------------ |
| `POST`  | `/api/auth/register`                | Create or refresh a registration; email a 6-digit OTP. |
| `PATCH` | `/api/auth/register/:id`            | Update name / location / mobile after OTP verify.      |
| `POST`  | `/api/auth/register/:id/verify-otp` | Verify the OTP, mint a JWT, mark User/Vendor active.   |
| `POST`  | `/api/auth/register/:id/resend-otp` | Issue and email a fresh OTP.                           |
| `POST`  | `/api/auth/google`                  | SPA exchanges a Google authorization code for a JWT.   |

## Removed (dead-code sweep)

The following legacy endpoints were deleted because no client uses them:

- `POST /api/auth/login` (`signIn` — username/password)
- `POST /api/auth/adminlogin`
- `POST /api/auth/register/mobile` (`withMobile`)
- `POST /api/auth/register/verifyotp` (`verifyOtp` mobile flow — distinct from
  the new `/register/:id/verify-otp`)
- `POST /api/auth/register/emailverification` (`withEmail`)
- `POST /api/auth/register/signup` (`signUp`)
- `POST /api/login` (separate dead `routes/login.js`)

Source files removed: `controller/Authcontroller.js`, `routes/AuthRoutes.js`,
`routes/login.js`.

## Pending migration

Still in legacy controllers; their own modules will follow:

- **Vendor login** (`routes/vendorlogin.js` + `controller/vendorLoginController.js`)
  — large surface incl. password reset and change-email/change-mobile OTP flows.
  Belongs in `modules/vendor-auth/`.
- **Admin auth** (`routes/adminAuth.js` + `controller/adminAuthController.js`)
  — `/api/admin/auth/login` for AdminStaff and `/api/admin/auth/login/superadmin`
  for the superadmin Admin model. Belongs in `modules/admin-auth/`.
- **Google OAuth browser flow** (`routes/googleAuth.js`) — passport-based
  redirect/callback. Less urgent; the SPA's code-exchange path now lives in
  this module.
