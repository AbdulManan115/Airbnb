require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001; // Changed default port to 5001

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to database first, then load routes
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connection established');

    // Load routes after database connection
    const userRoutes = require('./routes/userRoutes');
    const propertyRoutes = require('./routes/propertyRoutes');
    const authRoutes = require('./routes/authRoutes');
    const bookingRoutes = require('./routes/bookingRoutes');
    const guestRoutes = require('./routes/guestRoutes');
    const paymentRoutes = require('./routes/paymentRoutes');
    const taskRoutes = require('./routes/taskRoutes');
    const permissionRoutes = require('./routes/permissionRoutes');
    const roleRoutes = require('./routes/roleRoutes');
    const superadminRoutes = require('./routes/superadminRoutes');
    const hostRoutes = require('./routes/hostRoutes');
    const superadminStaffRoutes = require('./routes/superadminStaffRoutes');

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/superadmin', superadminRoutes);
    app.use('/api/hosts', hostRoutes);
    app.use('/api/superadmin/staff', superadminStaffRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/properties', propertyRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/guests', guestRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/permissions', permissionRoutes);
    app.use('/api/roles', roleRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'Server is running' });
    });

    // Auth test endpoint - verify token is working
    const { authenticate } = require('./middleware/authMiddleware');
    app.get('/api/auth/test', authenticate, (req, res) => {
      res.json({ 
        success: true, 
        message: 'Token is valid',
        user: {
          id: req.user.id || req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      });
    });

    // Start server only after database connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

