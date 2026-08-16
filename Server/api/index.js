const path = require("path");
// Validated environment — fails fast on missing/invalid vars. Must load before any other module
// that reads from process.env (jwt, db, mailer, etc.).
const env = require("../config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");
const { connectDB, mongoStatus } = require("../config/db");
const { requireJwt } = require("../middleware/auth");
const { requireFeature } = require("../middleware/permissions");
const { requireDatabase } = require("../middleware/dbReady");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("../config/passport");
const googleAuthRoutes = require("../modules/google-auth/google-auth.router");
const logger = require("../shared/logger");
const requestId = require("../shared/requestId");
const { notFoundHandler, errorHandler } = require("../shared/errorMiddleware");
const { closeBrowser: closeInvoiceBrowser } = require("../services/invoiceGenerator");

const app = express();
const serverio = http.createServer(app);

// Connect to MongoDB
const startDB = async () => {
  logger.info("Initiating MongoDB connection...");
  await connectDB();
  logger.info({ status: mongoStatus() }, "MongoDB connection attempt finished");
};

startDB();

// Enhanced CORS configuration - allow all origins in dev to avoid CORS issues
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://115.sofmatics.com",
  "https://travel-f.erpbuz.com",
  "https://socialpartner.in",
  "https://www.socialpartner.in",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Security headers. crossOriginResourcePolicy relaxed so /uploads can be embedded by the SPA.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

const io = new Server(serverio, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

// Onboarding endpoints embed photos / cover image / ID photos as base64 data URLs
// in the JSON body, which routinely exceeds the global limit. Parse those routes
// with a 25MB limit before the global parser runs — body-parser is a no-op once
// req._body is set, so the global parser below won't run a second time.
app.use("/api/onboarding", express.json({ limit: "25mb" }));
app.use("/api/onboarding", express.urlencoded({ extended: true, limit: "25mb" }));

// Body size limits — 50MB was indiscriminate. JSON bodies should never approach 1MB;
// upload routes use multer separately and are not gated by these limits.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Per-request id (sets req.id and X-Request-Id response header).
app.use(requestId);

// Structured request logger. Skips noisy health/static routes.
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    autoLogging: {
      ignore: (req) =>
        req.url === "/api/health" ||
        req.url === "/api/ping" ||
        req.url.startsWith("/uploads") ||
        req.url.startsWith("/invoices"),
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

//passport.js — SESSION_SECRET already validated by config/env.js
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === "production", // HTTPS only in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Serve static uploads and invoices
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));
const invoicesDir = path.join(process.cwd(), "invoices");
app.use("/invoices", express.static(invoicesDir));

// Import all migrated routes
const activitiesRoutes = require("../modules/activities/activities.router");
const adminAnalyticsRoutes = require("../modules/admin-analytics/admin-analytics.router");
const adminAuthRouter = require("../modules/admin-auth/admin-auth.router");
const adminCrmRoutes = require("../modules/admin-crm/admin-crm.router");
const adminDashboardRoutes = require("../modules/admin-dashboard/admin-dashboard.router");
const adminRolesRoutes = require("../modules/admin-roles/admin-roles.router");
const adminStaffRoutes = require("../modules/admin-staff/admin-staff.router");
const authModuleRouter = require("../modules/auth/auth.router");
const blogsRoutes = require("../modules/blogs/blogs.router");
const bookingDetailsRoutes = require("../modules/booking-details/booking-details.router");
const bookingsRouter = require("../modules/bookings/bookings.router");
const calendarBookingRoutes = require("../modules/calendar-bookings/calendar-bookings.router");
const campervansRoutes = require("../modules/campervans/campervans.router");
// Two routers, two trust boundaries — the public one exposes only the endpoints
// the marketing site calls. See modules/cms/cms.router.js.
const {
  adminRouter: cmsAdminRoutes,
  publicRouter: cmsPublicRoutes,
} = require("../modules/cms/cms.router");
const {
  adminRouter: cmsMediaAdminRoutes,
  publicRouter: cmsMediaPublicRoutes,
} = require("../modules/cms-media/cms-media.router");
const contactRoutes = require("../modules/contact/contact.router");
const helpdeskRoutes = require("../modules/helpdesk/helpdesk.router");
const managementRoutes = require("../modules/management/management.router");
const marketingRoutes = require("../modules/marketing/marketing.router");
const offersRoutes = require("../modules/offers/offers.router");
const onboardingRoutes = require("../modules/onboarding/onboarding.router");
const paymentsRouter = require("../modules/payments/payments.router");
const pluginsRoutes = require("../modules/plugins/plugins.router");
const profileRoutes = require("../modules/profile/profile.router");
const settingsRoutes = require("../modules/settings/settings.router");
const staysRoutes = require("../modules/stays/stays.router");
const tripsRoutes = require("../modules/trips/trips.router");
const usersRoutes = require("../modules/users/users.router");
const vendorAnalyticsRoutes = require("../modules/vendor-analytics/vendor-analytics.router");
const vendorChatsRoutes = require("../modules/vendor-chats/vendor-chats.router");
const vendorAuthRouter = require("../modules/vendor-auth/vendor-auth.router");
const vendorsRoutes = require("../modules/vendors/vendors.router");
const vendorSettingRoutes = require("../modules/vendor-setting/vendor-setting.router");
const notificationsRoutes = require("../modules/notifications/notifications.router");
const subscribersRoutes = require("../modules/subscribers/subscribers.router");

// Public routes
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  // A health check that answers "ok" while the database is unreachable is worse
  // than no health check — it's what a load balancer keeps routing traffic to.
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus(),
  });
});

// Every route below this line talks to MongoDB. Reject immediately when the
// connection is down instead of letting Mongoose buffer each query for 10s and
// surface it as an opaque 500. /api/ping and /api/health stay reachable so you
// can still ask the server what's wrong.
app.use("/api", requireDatabase);

// Public auth + user routes.
// /api/auth registration + OTP + Google sign-in is owned by the layered auth module
// (its own rate limiter is built in). The browser-redirect Google OAuth flow
// (GET /api/auth/google + GET /api/auth/google/callback) lives in
// modules/google-auth — it has to share the /api/auth prefix so the passport
// strategy's configured callbackURL (/api/auth/google/callback) resolves.
// Layered auth owns POST /google; google-auth owns GET /google + GET /google/callback.
app.use("/api/auth", authModuleRouter);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/user", usersRoutes);

// Vendor (and user) login + password reset + account update.
// Rate limiters and validation are built into the module router.
app.use("/api/vendorlogin", vendorAuthRouter);

// PUBLIC admin auth routes — rate limit + validate live inside the module router.
// Mounted before the `/api/admin` JWT gate so login + superadmin login are reachable.
app.use("/api/admin/auth", adminAuthRouter);

// 🔐 Protect ALL other admin routes
app.use("/api/admin", requireJwt({ adminOnly: true }));

// Onboarding routes
app.use("/api/onboarding", onboardingRoutes);

// Trips routes
app.use("/api/trips", tripsRoutes);

// Calendar Booking routes
app.use("/api/calendarbooking", calendarBookingRoutes);

// Offers routes
app.use("/api/offers", offersRoutes);

// New product details APIs
app.use("/api/activities", activitiesRoutes);
app.use("/api/campervans", campervansRoutes);
app.use("/api/stays", staysRoutes);

// Profile routes
app.use("/api/profile", profileRoutes);

// Vendor Analytics
app.use("/api/vendorAnalytics", vendorAnalyticsRoutes);

// Marketing routes for Vendors (protected)
app.use("/api/marketing", requireJwt(), marketingRoutes);

// Blogs routes (public + admin)
app.use("/api/blogs", blogsRoutes);

// Contact routes
app.use("/api/contact", contactRoutes);

// Main API routes
app.use("/api/management", managementRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vendors", vendorsRoutes);
// Bookings — full layered module (reads + writes).
app.use("/api/bookings", bookingsRouter);
app.use("/api/bookingDetails", bookingDetailsRoutes);
app.use("/api/payments", paymentsRouter);
app.use("/api/helpdesk", helpdeskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/vendorsetting", vendorSettingRoutes);
app.use("/api/vendorchats", vendorChatsRoutes);
app.use("/api/subscribers", subscribersRoutes);
app.use("/api/notifications", notificationsRoutes);

// Public CMS media (read-only for clients to fetch login/register images; the
// upload route requires a signed-in user) - MUST be before /cms to take priority
app.use("/api/cms/media", cmsMediaPublicRoutes);
// Public CMS routes — read-only, plus job applications and testimonial
// submissions. Writes live on the admin mount below.
app.use("/api/cms", cmsPublicRoutes);

// Admin routes. The /api/admin requireJwt mount above only proves the caller
// holds an admin token — `requireFeature` is what enforces the role's features,
// so a staff member limited to e.g. view_dashboard can't reach these. Read
// requests need canView on the feature, writes need canCreate/canEdit/canDelete.
// Superadmins bypass. See middleware/permissions.js.
app.use("/api/admin/management", requireFeature("access_management"), managementRoutes);
app.use("/api/admin/users", requireFeature("manage_users"), usersRoutes);
app.use("/api/admin/vendors", requireFeature("manage_vendors"), vendorsRoutes);
app.use("/api/admin/bookings", requireFeature("access_bookings"), bookingsRouter);
app.use("/api/admin/payments", requireFeature("manage_payments"), paymentsRouter);
app.use("/api/admin/helpdesk", requireFeature("support_tickets"), helpdeskRoutes);
app.use("/api/admin/settings", requireFeature("manage_settings"), settingsRoutes);
app.use("/api/admin/crm", requireFeature("manage_crm"), adminCrmRoutes);
app.use("/api/admin/marketing", requireFeature("manage_marketing"), marketingRoutes);
app.use("/api/admin/plugins", requireFeature("manage_plugins"), pluginsRoutes);
app.use("/api/admin/staff", requireFeature("manage_staff"), adminStaffRoutes);
app.use("/api/admin/roles", requireFeature("manage_roles"), adminRolesRoutes);
app.use("/api/admin/blogs", requireFeature("manage_cms"), blogsRoutes);
// Notifications are the acting admin's own inbox, not a managed area — any
// authenticated admin may read and dismiss their own.
app.use("/api/admin/notifications", notificationsRoutes);

// Admin CMS Media routes (upload/list/delete images for pages) - MUST be before /cms to take priority
app.use("/api/admin/cms/media", requireFeature("manage_cms"), cmsMediaAdminRoutes);
// Admin CMS routes — flag the request so the router's testimonials filter
// and contact upsert can short-circuit the admin/public branch instead of
// sniffing baseUrl.
app.use(
  "/api/admin/cms",
  requireFeature("manage_cms"),
  (req, _res, next) => {
    req.isAdminContext = true;
    next();
  },
  cmsAdminRoutes,
);

// Admin Dashboard & Analytics endpoints.
//
// These two routers are mounted on broad prefixes ("/api" and "/api/admin"), so
// the feature guards are attached to the exact paths the routers declare rather
// than to the mount. Guarding the mount itself would run the admin permission
// check on every public /api request (and turn unmatched /api/admin paths into
// 403s instead of 404s).
app.use("/api/admin/dashboard", requireFeature("view_dashboard"));
app.use("/api", adminDashboardRoutes);

app.use("/api/admin/adminAnalytics", requireFeature("view_analytics"));
app.use("/api/admin/adminAnalyticsReport", requireFeature("view_analytics"));
app.use("/api/admin", adminAnalyticsRoutes);

// Admin contact routes — the CMS "Contact Us" inbox. The admin JWT gate is
// already applied to the whole /api/admin mount above, so only the feature
// check is needed here; re-running requireJwt just verified the same token twice.
app.use("/api/admin/contact", requireFeature("manage_cms"), contactRoutes);

//root route
app.get("/", (req, res) => {
  res.send(`Travel Dashboard Server is running! Mongo connection: ${mongoStatus()}`);
});

// 404 + central error handler — must be the LAST middleware registered.
app.use(notFoundHandler);
app.use(errorHandler);

// Socket logging goes through pino at debug level rather than console.log.
// console.log here wrote a line to stdout for every join and every message —
// unstructured, unredacted (the send_message payload was logged verbatim), and
// synchronous. `logger.debug` is off by default in production and redacts the
// fields shared/logger.js is configured to hide.
const socketLog = logger.child({ component: "socket" });

io.on("connection", (socket) => {
  // When a user selects a chat, they join a specific room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  // Allow users/vendors to join a room specific to their ID for notifications
  socket.on("join_identity", (identityId) => {
    if (identityId) {
      socket.join(identityId);
      socketLog.debug({ socketId: socket.id, identityId }, "joined identity room");
    }
  });

  socket.on("join_all_user_rooms", (chatIds) => {
    if (Array.isArray(chatIds)) {
      chatIds.forEach((id) => socket.join(id));
      socketLog.debug({ socketId: socket.id, rooms: chatIds.length }, "joined background rooms");
    }
  });

  // Listen for message from client
  socket.on("send_message", (data) => {
    socketLog.debug(
      { chatId: data.chatId, recipientId: data.recipientId, senderId: data.senderId },
      "send_message received",
    );

    // Broadcast the message ONLY to people in that specific chatId room
    if (data.chatId) {
      io.to(data.chatId).emit("receive_message", data);
    }

    // Also broadcast to the recipient directly if they are not in the chat room yet
    if (data.recipientId) {
      socketLog.debug({ recipientId: data.recipientId }, "broadcasting to recipient room");
      io.to(data.recipientId).emit("receive_message", data);
    }

    if (!data.chatId && !data.recipientId) {
      // Fallback: broadcast to all (standard behavior)
      io.emit("receive_message", data);
    }
  });

  socket.on("disconnect", () => {
    socketLog.debug({ socketId: socket.id }, "disconnected");
  });
});

serverio.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, url: `http://localhost:${env.PORT}` },
    `Travel Dashboard Server running`,
  );
});

/**
 * Graceful shutdown.
 *
 * The invoice generator now keeps one headless Chromium alive and reuses it
 * across invoices instead of launching one per PDF. That process is a child of
 * this one, so it has to be closed explicitly — otherwise a restart leaks a
 * Chromium (~300MB) every time.
 */
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down");
    try {
      await closeInvoiceBrowser();
    } catch (err) {
      logger.warn({ err: err.message }, "invoice browser close failed");
    }
    serverio.close(() => process.exit(0));
    // Don't hang forever on a stuck keep-alive connection.
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}

module.exports = app;
