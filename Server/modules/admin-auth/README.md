# Admin-auth module

Admin login + `getMe`. Same layered shape as `modules/auth/` and
`modules/vendor-auth/`.

## Endpoints

| Method | Path                               | Auth        | Purpose                                                                                 |
| ------ | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `POST` | `/api/admin/auth/login`            | public      | AdminStaff login (primary).                                                             |
| `POST` | `/api/admin/auth/login/superadmin` | public      | Legacy superadmin Admin login. Kept for the bootstrap account; new admins use `/login`. |
| `GET`  | `/api/admin/auth/me`               | JWT (admin) | Current AdminStaff record from the JWT subject.                                         |

## Notes

- Credentials live in two collections: `AdminStaff` (primary) and `Admin`
  (legacy superadmin). Tokens from either pass `requireJwt({ adminOnly: true })`
  because both set `type: "admin"` / `type: "superadmin"`.
- `/login` rejects `status !== "Active"` accounts with 403 (kept the legacy
  copy "Account not active. Contact admin.").
- `lastLogin` updates on AdminStaff login are best-effort and don't fail the
  request.
- The superadmin response shape (`{ status: "success", admin: { token } }`)
  is preserved verbatim because the Admin SPA reads it that way today;
  Phase 4 unification will normalise both shapes.
