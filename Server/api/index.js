const path = require('path');
// Load environment variables from .env.production if in production mode
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require("dotenv").config({ path: path.join(__dirname, '..', envFile) });

const express = require("express");
const cors = require('cors');
const http = require('http');
const { connectDB, mongoStatus } = require("../config/db");
const { requireJwt } = require("../middleware/auth");
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('../config/passport');
const googleAuthRoutes = require('../routes/googleAuth');

const app = express();
const serverio = http.createServer(app);

// Connect to MongoDB
const startDB = async () => {
  console.log('Initiating MongoDB connection...');
  await connectDB();
  console.log('MongoDB connection attempt finished. Status:', mongoStatus());
};

startDB();

// Enhanced CORS configuration - allow all origins in dev to avoid CORS issues
const allowedOrigins = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000', 'http://localhost:3001','https://115.sofmatics.com', 'https://travel-f.erpbuz.com'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

const io = new Server(serverio, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));


//passport.js
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve static uploads and invoices
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
const invoicesDir = path.join(process.cwd(), 'invoices');
app.use('/invoices', express.static(invoicesDir));

// Import ALL routes
console.log('Loading auth routes...');
const authroutes = require("../routes/AuthRoutes");
console.log('Loading user routes...');
const userroutes = require("../routes/userRoutes");

// Import all migrated routes
console.log('Loading activities routes...');
const activitiesRoutes = require("../routes/activities");
const adminAnalyticsRoutes = require("../routes/adminAnalytics");
const adminAuthRoutes = require("../routes/adminAuth");
const adminCrmRoutes = require("../routes/adminCrm");
const adminDashboardRoutes = require("../routes/adminDashboard");
const adminRolesRoutes = require("../routes/adminRoles");
const adminStaffRoutes = require("../routes/adminStaff");
const authRegisterRoutes = require("../routes/authRegister");
const blogsRoutes = require("../routes/blogs");
const bookingDetailsRoutes = require("../routes/bookingDetails");
const bookingsRoutes = require("../routes/bookings");
const calendarBookingRoutes = require("../routes/calendarbooking");
const campervansRoutes = require("../routes/campervans");
const cmsRoutes = require("../routes/cms");
const cmsMediaRoutes = require("../routes/cmsMedia");
const contactRoutes = require("../routes/contact");
const demoRoutes = require("../routes/demo");
const globlsettingRoutes = require("../routes/globlsetting");
const helpdeskRoutes = require("../routes/helpdesk");
const loginRoutes = require("../routes/login");
const managementRoutes = require("../routes/management");
const marketingRoutes = require("../routes/marketing");
console.log('Loading offers routes...');
const offersRoutes = require("../routes/offers");
const onboardingRoutes = require("../routes/onboarding");
const paymentsRoutes = require("../routes/payments");
const pluginsRoutes = require("../routes/plugins");
const profileRoutes = require("../routes/profile");
const settingsRoutes = require("../routes/settings");
const staysRoutes = require("../routes/stays");
const tripsRoutes = require("../routes/trips");
const usersRoutes = require("../routes/users");
const vendorAnalyticsRoutes = require("../routes/vendorAnalytics");
const vendorChatsRoutes = require("../routes/vendorChats");
const vendorLoginRoutes = require("../routes/vendorlogin");
const vendorsRoutes = require("../routes/vendors");
const vendorSettingRoutes = require("../routes/vendorsetting");
const notificationsRoutes = require("../routes/notifications");
const subscribersRoutes = require("../routes/subscribers");

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/cms/media') || req.path.includes('/admin')) {
    console.log(`[API REQUEST] ${req.method} ${req.path} - Headers:`, { 
      auth: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    });
  }
  next();
});

// Public routes
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus()
  });
});


// Legacy routes (keep for backward compatibility)
app.use("/auth/", authroutes);
app.use("/api/auth/", authroutes);
app.use("/user/", userroutes);
app.use('/api', googleAuthRoutes);
app.use('/', googleAuthRoutes);

// Public login route -> delegates to admin login controller (DB validation only)
app.use('/api', loginRoutes);

// Public registration route (user or vendor)
app.use('/api', authRegisterRoutes);

// Vendor login & password reset routes
app.use('/api', vendorLoginRoutes);

// Secure admin auth routes
// app.use('/api', adminAuthRoutes);

// 🔓 PUBLIC ADMIN AUTH ROUTES (NO JWT)
app.use('/api/admin/auth', adminAuthRoutes);

// 🔐 Protect ALL other admin routes
app.use('/api/admin', requireJwt({ adminOnly: true }));
// Demo route
app.use('/api/demo', demoRoutes);

// Onboarding routes
app.use('/api/onboarding', onboardingRoutes);

// Trips routes
app.use('/api', tripsRoutes);

// Calendar Booking routes
app.use('/api/calendarbooking', calendarBookingRoutes);

// Offers routes
app.use('/api/offers', offersRoutes);

// New product details APIs
app.use('/api/activities', activitiesRoutes);
app.use('/api/campervans', campervansRoutes);
app.use('/api/stays', staysRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Vendor Analytics
app.use('/api', vendorAnalyticsRoutes);

// Marketing routes for Vendors (protected)
app.use('/api/marketing', requireJwt(), marketingRoutes);

// Blogs routes (public + admin)
app.use('/api/blogs', blogsRoutes);

// Contact routes
app.use('/api/contact', contactRoutes);

// Main API routes
app.use('/api/management', managementRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/bookingDetails', bookingDetailsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vendorsetting', vendorSettingRoutes);
app.use('/api/vendorchats', vendorChatsRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/notifications', notificationsRoutes);

// Public CMS media (read-only for clients to fetch login/register images) - MUST be before /cms to take priority
app.use('/api/cms/media', cmsMediaRoutes);
// Public CMS routes for testimonials (list + create)
app.use('/api/cms', cmsRoutes);

// Protect ALL /api/admin/* routes
app.use('/api/admin', requireJwt({ adminOnly: true }));

// Admin routes (using the same controllers)
app.use('/api/admin/management', managementRoutes);
app.use('/api/admin/users', (req, res, next) => {
  console.log(`[AdminAPI] Incoming request: ${req.method} ${req.url}`);
  next();
}, usersRoutes);
app.use('/api/admin/vendors', vendorsRoutes);
app.use('/api/admin/bookings', bookingsRoutes);
app.use('/api/admin/payments', paymentsRoutes);
app.use('/api/admin/helpdesk', helpdeskRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/crm', adminCrmRoutes);
app.use('/api/admin/marketing', marketingRoutes);
app.use('/api/admin/plugins', pluginsRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/roles', adminRolesRoutes);
app.use('/api/admin/blogs', blogsRoutes);
app.use('/api/admin/notifications', notificationsRoutes);

// Admin CMS Media routes (upload/list/delete images for pages) - MUST be before /cms to take priority
app.use('/api/admin/cms/media', cmsMediaRoutes);
// Admin CMS routes (full management)
app.use('/api/admin/cms', cmsRoutes);
app.use('/api/admin/Globlsetting', globlsettingRoutes);

// Admin Dashboard & Analytics endpoints
app.use('/api', adminDashboardRoutes);
app.use('/api/admin', adminAnalyticsRoutes);

// Admin contact routes (protected)
app.use('/api/admin/contact', requireJwt({ adminOnly: true }), contactRoutes);

//root route
app.get("/", (req, res) => {
  res.send(`Travel Dashboard Server is running! Mongo connection: ${mongoStatus()}`);
});

// 404 catch-all for debugging
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - No matching route found`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    receivedPath: req.path,
    receivedMethod: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

io.on('connection', (socket) => {
  // When a user selects a chat, they join a specific room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  // Allow users/vendors to join a room specific to their ID for notifications
  socket.on('join_identity', (identityId) => {
      if (identityId) {
          socket.join(identityId);
          console.log(`Socket ${socket.id} joined identity room: ${identityId}`);
      }
  });

  socket.on('join_all_user_rooms', (chatIds) => {
    if (Array.isArray(chatIds)) {
      chatIds.forEach(id => socket.join(id));
      console.log(`User joined ${chatIds.length} rooms for background updates`);
    }
  });

  // Listen for message from client
  socket.on('send_message', (data) => {
    console.log(`[Socket] send_message received:`, { 
        chatId: data.chatId, 
        recipientId: data.recipientId, 
        senderId: data.senderId 
    });

    // Broadcast the message ONLY to people in that specific chatId room
    if (data.chatId) {
      io.to(data.chatId).emit('receive_message', data);
    } 
    
    // Also broadcast to the recipient directly if they are not in the chat room yet
    if (data.recipientId) {
        console.log(`[Socket] Broadcasting to recipient room: ${data.recipientId}`);
        io.to(data.recipientId).emit('receive_message', data);
    }

    if (!data.chatId && !data.recipientId) {
      // Fallback: broadcast to all (standard behavior)
      io.emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
serverio.listen(PORT, () => {
  console.log(`🚀 Travel Dashboard Server running on port ${PORT}`);
  console.log(`📅 API available at http://localhost:${PORT}`);
  console.log(`🔗 Health check at http://localhost:${PORT}/api/health`);
});

module.exports = app;
