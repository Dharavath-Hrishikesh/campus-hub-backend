const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/events', eventRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Hub API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;