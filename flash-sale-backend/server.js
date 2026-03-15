const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { initWorker } = require('./queue/queueWorker');
const buyRoutes = require('./routes/buy');
const authRoutes = require('./auth');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Worker
initWorker(io);

// Pass io to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Rate limiter — Increased for Hackathon Demo
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Up from 100
  message: { status: 'error', message: 'Too many requests. Slow down.' }
});

// Strict limiter for checkout — Increased for Overload Simulation
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500, // Up from 20
  message: { status: 'error', message: 'Too many checkout attempts.' }
});


app.use('/api', limiter);
app.use('/api/checkout', checkoutLimiter);
app.use('/api', buyRoutes);
app.use('/auth', authRoutes);

app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3013
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
