require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("./config/passport");

const { connectDB, mongoStatus } = require("./config/db");
const { requireJwt } = require("./middleware/auth");

const app = express();

/* ===============================
   DATABASE CONNECTION (SAFE)
================================= */
connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected:", mongoStatus());
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
  });

/* ===============================
   MIDDLEWARE
================================= */

// Enhanced CORS configuration - allow all origins in dev to avoid CORS issues
const allowedOrigins = [
  'http://localhost:8080', 
  'http://localhost:5173', 
  'http://localhost:8081', 
  'http://localhost:5174', 
  'http://localhost:5175', 
  'http://localhost:3000', 
  'https://115.sofmatics.com',
  'https://travel-f.erpbuz.com'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* ===============================
   STATIC FILES
================================= */

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.use(
  "/invoices",
  express.static(path.join(process.cwd(), "invoices"))
);

/* ===============================
   ROUTES IMPORT
================================= */

const authroutes = require("./routes/AuthRoutes");
const googleAuthRoutes = require("./routes/googleAuth");
const userroutes = require("./routes/userRoutes");
const activitiesRoutes = require("./routes/activities");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");
const adminAuthRoutes = require("./routes/adminAuth");
const adminCrmRoutes = require("./routes/adminCrm");
const adminDashboardRoutes = require("./routes/adminDashboard");
const adminRolesRoutes = require("./routes/adminRoles");
const adminStaffRoutes = require("./routes/adminStaff");
const authRegisterRoutes = require("./routes/authRegister");
const blogsRoutes = require("./routes/blogs");
const bookingDetailsRoutes = require("./routes/bookingDetails");
const bookingsRoutes = require("./routes/bookings");
const calendarBookingRoutes = require("./routes/calendarbooking");
const campervansRoutes = require("./routes/campervans");
const cmsRoutes = require("./routes/cms");
const cmsMediaRoutes = require("./routes/cmsMedia");
const contactRoutes = require("./routes/contact");
const demoRoutes = require("./routes/demo");
const globlsettingRoutes = require("./routes/globlsetting");
const helpdeskRoutes = require("./routes/helpdesk");
const loginRoutes = require("./routes/login");
const managementRoutes = require("./routes/management");
const marketingRoutes = require("./routes/marketing");
const offersRoutes = require("./routes/offers");
const onboardingRoutes = require("./routes/onboarding");
const paymentsRoutes = require("./routes/payments");
const pluginsRoutes = require("./routes/plugins");
const profileRoutes = require("./routes/profile");
const settingsRoutes = require("./routes/settings");
const staysRoutes = require("./routes/stays");
const tripsRoutes = require("./routes/trips");
const usersRoutes = require("./routes/users");
const vendorAnalyticsRoutes = require("./routes/vendorAnalytics");
const vendorChatsRoutes = require("./routes/vendorChats");
const vendorLoginRoutes = require("./routes/vendorlogin");
const vendorsRoutes = require("./routes/vendors");
const vendorSettingRoutes = require("./routes/vendorsetting");
const notificationsRoutes = require("./routes/notifications");
const subscribersRoutes = require("./routes/subscribers");

/* ===============================
   PUBLIC ROUTES
================================= */

app.get("/", (req, res) => {
  res.send(
    `🚀 Travel Dashboard Server Running | MongoDB: ${mongoStatus()}`
  );
});

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", time: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoStatus(),
    time: new Date().toISOString(),
  });
});

/* ===============================
   ROUTE MIDDLEWARE
================================= */

// Legacy
app.use("/auth", authroutes);
app.use("/api/auth", authroutes); 
app.use("/user", userroutes);

// Public auth
app.use("/api", loginRoutes);
app.use("/api", authRegisterRoutes);
app.use("/api", vendorLoginRoutes);


// Admin public auth
app.use("/api/admin/auth", adminAuthRoutes);

// Protect all admin routes
app.use("/api/admin", requireJwt({ adminOnly: true }));

/* ===============================
   MAIN API ROUTES
================================= */

app.use("/api/demo", demoRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api", tripsRoutes);
app.use("/api/calendarbooking", calendarBookingRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/campervans", campervansRoutes);
app.use("/api/stays", staysRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", vendorAnalyticsRoutes);
app.use("/api/marketing", requireJwt(), marketingRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vendors", vendorsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/bookingDetails", bookingDetailsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/helpdesk", helpdeskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/vendorsetting", vendorSettingRoutes);
app.use("/api/vendorchats", vendorChatsRoutes);
app.use("/api/subscribers", subscribersRoutes);
app.use("/api/notifications", notificationsRoutes);

// CMS
app.use("/api/cms/media", cmsMediaRoutes);
app.use("/api/cms", cmsRoutes);

/* ===============================
   ADMIN ROUTES
================================= */

app.use("/api/admin/management", managementRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/vendors", vendorsRoutes);
app.use("/api/admin/bookings", bookingsRoutes);
app.use("/api/admin/payments", paymentsRoutes);
app.use("/api/admin/helpdesk", helpdeskRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/crm", adminCrmRoutes);
app.use("/api/admin/marketing", marketingRoutes);
app.use("/api/admin/plugins", pluginsRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/roles", adminRolesRoutes);
app.use("/api/admin/blogs", blogsRoutes);
app.use("/api/admin/notifications", notificationsRoutes);
app.use("/api/admin/cms/media", cmsMediaRoutes);
app.use("/api/admin/cms", cmsRoutes);
app.use("/api/admin/Globlsetting", globlsettingRoutes);
// Admin Dashboard & Analytics endpoints
app.use("/api", adminDashboardRoutes);
app.use("/api/admin", adminAnalyticsRoutes);

/* ===============================
   404 HANDLER
================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

/* ===============================
   ERROR HANDLER
================================= */

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* ===============================
   EXPORT (IMPORTANT FOR PASSENGER)
================================= */

module.exports = app;
