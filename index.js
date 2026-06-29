const http = require('http');
const { initializeSocket } = require('./config/socket');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const lostItemRoutes = require('./routes/lostItemRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lost-items', lostItemRoutes);


// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Hub API is running' });
});

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;