/**
 * Feature-level authorization for /api/admin routes.
 *
 * `requireJwt({ adminOnly: true })` only proves the caller holds an admin token.
 * It never looked at the role's features, so ANY staff account could reach every
 * admin endpoint — including `POST /api/admin/roles`, which let a restricted
 * staff member mint themselves a role with `manage_staff` / `manage_roles` and
 * escalate to full access.
 *
 * Two deliberate choices:
 *
 *  1. Features are resolved from the database on every request instead of being
 *     baked into the JWT, so revoking a permission takes effect immediately
 *     rather than at the staff member's next login. The lookup is memoised per
 *     request, so stacking several guards costs one query.
 *
 *  2. The HTTP method decides which flag is required, which is what makes the
 *     role matrix's "view" vs "full" columns mean something:
 *       GET/HEAD → canView, POST → canCreate, PUT/PATCH → canEdit, DELETE → canDelete
 */
const AdminStaff = require("../models/AdminStaff");
const logger = require("../shared/logger");

/**
 * A superadmin is not described by feature flags — the bootstrap account has no
 * AdminRole document at all, so gating it on features would lock it out of its
 * own panel. Recognised by JWT type or by role name.
 */
const SUPERADMIN_ROLE_NAMES = new Set(["superadmin", "super admin"]);

const normalise = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const isSuperadminActor = (jwtUser, staff) =>
  normalise(jwtUser?.type) === "superadmin" ||
  SUPERADMIN_ROLE_NAMES.has(normalise(jwtUser?.role)) ||
  SUPERADMIN_ROLE_NAMES.has(normalise(staff?.role));

/** Which permission flag a request method needs. */
function actionForMethod(method) {
  switch (String(method || "").toUpperCase()) {
    case "GET":
    case "HEAD":
    case "OPTIONS":
      return "canView";
    case "POST":
      return "canCreate";
    case "PUT":
    case "PATCH":
      return "canEdit";
    case "DELETE":
      return "canDelete";
    default:
      return "canEdit";
  }
}

/**
 * Load the acting staff member (with their role) once per request.
 * Returns `{ staff, superadmin }`; `staff` is null for superadmin tokens whose
 * subject lives in the legacy Admin collection.
 */
async function loadActor(req) {
  if (req.adminActor) return req.adminActor;

  const id = req.user?.sub;
  let staff = null;
  if (id) {
    try {
      staff = await AdminStaff.findById(id).populate(
        "roleId",
        "name features permissions isActive",
      );
    } catch (err) {
      logger.warn({ err, id }, "[permissions] failed to load acting staff");
    }
  }

  req.adminActor = { staff, superadmin: isSuperadminActor(req.user, staff) };
  return req.adminActor;
}

/**
 * The effective grant for one feature.
 *
 * `permissions[]` rows are authoritative when present. A role that only lists
 * the slug in `features` (roles created through the API without a matrix) is
 * treated as full access to that area — `features` is the coarse "has access"
 * signal and predates the fine-grained rows.
 */
function grantFor(role, feature) {
  if (!role) return null;

  const row = (role.permissions || []).find((p) => normalise(p.feature) === normalise(feature));
  if (row) {
    return {
      canView: row.canView !== false,
      canEdit: !!row.canEdit,
      canCreate: !!row.canCreate,
      canDelete: !!row.canDelete,
    };
  }

  const listed = (role.features || []).some((f) => normalise(f) === normalise(feature));
  if (listed) return { canView: true, canEdit: true, canCreate: true, canDelete: true };

  return null;
}

/**
 * Guard a route (or a whole router mount) behind one or more features. Access is
 * granted when ANY of the listed features permits the request's action, so a
 * route reachable from two areas can name both.
 *
 * Usage:  app.use("/api/admin/users", requireFeature("manage_users"), usersRoutes)
 */
function requireFeature(...features) {
  const required = features.flat().filter(Boolean);

  return async (req, res, next) => {
    try {
      const { staff, superadmin } = await loadActor(req);
      if (superadmin) return next();

      if (!staff) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Admin account no longer exists" },
        });
      }

      // A token issued before the account was disabled must stop working.
      if (staff.status && staff.status !== "Active") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Account is not active" },
        });
      }

      const role = staff.roleId;
      if (role && role.isActive === false) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Your role has been deactivated" },
        });
      }

      const action = actionForMethod(req.method);
      const allowed = required.some((f) => {
        const grant = grantFor(role, f);
        return !!grant && grant[action] === true;
      });

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `Your role does not permit this action (${required.join(" or ")})`,
          },
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * The caller's own permission set, for `GET /api/admin/auth/me` so the SPA can
 * hide what the API would refuse anyway.
 */
async function describeActorPermissions(req) {
  const { staff, superadmin } = await loadActor(req);
  const role = staff?.roleId || null;
  return {
    superadmin,
    roleName: role?.name || staff?.role || req.user?.role || null,
    features: superadmin ? "*" : [...(role?.features || [])],
    permissions: superadmin ? [] : [...(role?.permissions || [])],
  };
}

module.exports = { requireFeature, describeActorPermissions, loadActor, actionForMethod, grantFor };
