require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { runAlertEngine } = require('./controllers/alertController');

const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const billRoutes = require('./routes/bills');
const alertRoutes = require('./routes/alerts');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customer');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Configure CORS: in production restrict to BASE_URL; in development echo request origin so credentials work
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.BASE_URL : (origin, callback) => callback(null, true),
  credentials: true
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve a simple SVG favicon for browsers that request /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favicon.svg'));
});

// Serve static files with cache disabled in development so login page updates are picked up immediately
const staticCacheOptions = process.env.NODE_ENV === 'production' ? { maxAge: '1d' } : { maxAge: 0, etag: false, lastModified: false };
app.use(express.static(path.join(__dirname, '..', 'public'), staticCacheOptions));

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  cron.schedule('0 7 * * *', () => {
    console.log('Running daily alert engine...');
    runAlertEngine();
  });

  server.listen(PORT, () => {
    console.log(`MediFlow server running on port ${PORT}`);
  });
});

module.exports = { app, server };
