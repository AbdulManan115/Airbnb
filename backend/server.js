require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/properties', propertyRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/guests', guestRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/permissions', permissionRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'Server is running' });
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

