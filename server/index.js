require('dotenv').config();
const http = require('http');
const express = require('express');

const authRoutes = require('./src/routes/authRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const { initSocket } = require('./src/socket');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = initSocket(httpServer);
app.set('io', io);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Hive API is running.' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Hive server running on port ${PORT}`);
  });
}

module.exports = app;
