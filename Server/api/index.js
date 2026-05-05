const path = require("path");
// Validated environment — fails fast on missing/invalid vars. Must load before any other module
// that reads from process.env (jwt, db, mailer, etc.).
const env = require("../config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const pinoHttp = require("pino-http");
const { connectDB, mongoStatus } = require("../config/db");
const { requireJwt } = require("../middleware/auth");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("../config/passport");
const googleAuthRoutes = require("../routes/googleAuth");
const logger = require("../shared/logger");
const requestId = require("../shared/requestId");
const { notFoundHandler, errorHandler } = require("../shared/errorMiddleware");

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

// Import ALL routes
const usersRouter = require("../modules/users/users.router");

// Import all migrated routes
console.log("Loading activities routes...");
const activitiesRoutes = require("../routes/activities");
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
const campervansRoutes = require("../routes/campervans");
const cmsRoutes = require("../modules/cms/cms.router");
const cmsMediaRoutes = require("../modules/cms-media/cms-media.router");
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
const staysRoutes = require("../routes/stays");
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
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus(),
  });
});

// Public auth + user routes.
// /api/auth registration + OTP + Google sign-in is owned by the layered auth module
// (its own rate limiter is built in). The browser-redirect Google OAuth flow
// (GET /api/auth/google + /callback) lives in routes/googleAuth.js, mounted next.
app.use("/api/auth", authModuleRouter);
app.use("/api/user", usersRouter);
app.use("/api", googleAuthRoutes);

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

// Public CMS media (read-only for clients to fetch login/register images) - MUST be before /cms to take priority
app.use("/api/cms/media", cmsMediaRoutes);
// Public CMS routes for testimonials (list + create)
app.use("/api/cms", cmsRoutes);

// Admin routes (using the same controllers — already protected above by /api/admin requireJwt mount)
app.use("/api/admin/management", managementRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/vendors", vendorsRoutes);
app.use("/api/admin/bookings", bookingsRouter);
app.use("/api/admin/payments", paymentsRouter);
app.use("/api/admin/helpdesk", helpdeskRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/crm", adminCrmRoutes);
app.use("/api/admin/marketing", marketingRoutes);
app.use("/api/admin/plugins", pluginsRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/roles", adminRolesRoutes);
app.use("/api/admin/blogs", blogsRoutes);
app.use("/api/admin/notifications", notificationsRoutes);

// Admin CMS Media routes (upload/list/delete images for pages) - MUST be before /cms to take priority
app.use("/api/admin/cms/media", cmsMediaRoutes);
// Admin CMS routes — flag the request so the router's testimonials filter
// and contact upsert can short-circuit the admin/public branch instead of
// sniffing baseUrl.
app.use(
  "/api/admin/cms",
  (req, _res, next) => {
    req.isAdminContext = true;
    next();
  },
  cmsRoutes,
);

// Admin Dashboard & Analytics endpoints
app.use("/api", adminDashboardRoutes);
app.use("/api/admin", adminAnalyticsRoutes);

// Admin contact routes (protected)
app.use("/api/admin/contact", requireJwt({ adminOnly: true }), contactRoutes);

//root route
app.get("/", (req, res) => {
  res.send(`Travel Dashboard Server is running! Mongo connection: ${mongoStatus()}`);
});

// 404 + central error handler — must be the LAST middleware registered.
app.use(notFoundHandler);
app.use(errorHandler);

io.on("connection", (socket) => {
  // When a user selects a chat, they join a specific room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  // Allow users/vendors to join a room specific to their ID for notifications
  socket.on("join_identity", (identityId) => {
    if (identityId) {
      socket.join(identityId);
      console.log(`Socket ${socket.id} joined identity room: ${identityId}`);
    }
  });

  socket.on("join_all_user_rooms", (chatIds) => {
    if (Array.isArray(chatIds)) {
      chatIds.forEach((id) => socket.join(id));
      console.log(`User joined ${chatIds.length} rooms for background updates`);
    }
  });

  // Listen for message from client
  socket.on("send_message", (data) => {
    console.log(`[Socket] send_message received:`, {
      chatId: data.chatId,
      recipientId: data.recipientId,
      senderId: data.senderId,
    });

    // Broadcast the message ONLY to people in that specific chatId room
    if (data.chatId) {
      io.to(data.chatId).emit("receive_message", data);
    }

    // Also broadcast to the recipient directly if they are not in the chat room yet
    if (data.recipientId) {
      console.log(`[Socket] Broadcasting to recipient room: ${data.recipientId}`);
      io.to(data.recipientId).emit("receive_message", data);
    }

    if (!data.chatId && !data.recipientId) {
      // Fallback: broadcast to all (standard behavior)
      io.emit("receive_message", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

serverio.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, url: `http://localhost:${env.PORT}` },
    `Travel Dashboard Server running`,
  );
});

module.exports = app;
