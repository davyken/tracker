require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const mongoose   = require('mongoose');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Tracker joins a room for a specific session to get live updates
  socket.on('watch_session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`👁  Watching session: ${sessionId}`);
  });

  socket.on('unwatch_session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://localhost:5173' }));
app.use(express.json({ limit: '20mb' })); // large enough for base64 images
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/bait', require('./routes/bait'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ── MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
