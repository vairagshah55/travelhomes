# Vendor-auth module

Vendor-side login, password-reset, and account-update flows. Same layered
shape as `modules/auth/`:

```
vendor-auth.dto.js          zod schemas
vendor-auth.service.js      business logic, no req/res, throws AppError
vendor-auth.controller.js   thin: req.validated -> service -> res.json
vendor-auth.router.js       rate-limit -> validate -> controller
__tests__/                  vitest validation tests
```

The module also handles **users** logging in — the legacy `Register` schema
mixes both `userType: "user"` and `userType: "vendor"` rows, and the login
endpoint resolves the right one by trying password match against every row
that shares the email/mobile.

## Endpoints

| Method | Path                               | Purpose                                                                                                                           |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/vendorlogin/login`           | Password login. Accepts an email **or** a mobile number in the `email` field.                                                     |
| `POST` | `/api/vendorlogin/forgot`          | Issue a password-reset OTP via email + SMS. Returns success even when the account doesn't exist (anti-enumeration).               |
| `POST` | `/api/vendorlogin/verify-otp`      | Confirm the forgot-password OTP without consuming it (allows the UI to show a reset form).                                        |
| `POST` | `/api/vendorlogin/reset`           | Set a new password using a verified OTP. Updates **all** Register rows that share the email — handles legacy duplicate-row cases. |
| `POST` | `/api/vendorlogin/update-account`  | Change email / mobile / password while authenticated. Mirrors changes into `Profile` and `Vendor`.                                |
| `POST` | `/api/vendorlogin/send-change-otp` | Issue an OTP to the **new** email or mobile to confirm a change.                                                                  |

## Notes carried over from the legacy controller

- The `email` field on login/forgot/verify-otp/reset accepts an email **or**
  a mobile number. The service detects which by looking for `@`.
- `forgotPassword` always returns success regardless of whether the account
  exists. This is intentional anti-enumeration.
- `resetPassword` updates **all** Register rows matching the email + OTP.
  Some legacy users have duplicate rows for vendor and user modes; updating
  them in lockstep keeps password consistent.
- `sendChangeOtp` returns the OTP in the response **only** when
  `NODE_ENV=development` for local testing. Never in prod.
