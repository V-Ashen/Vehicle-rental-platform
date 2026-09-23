import app from './app';

import { CronService } from './services/CronService';

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Start background workers for MVP (In production, use Google Cloud Scheduler)
  const cronService = new CronService();
  console.log(`⏱️ Starting background Cron Workers...`);
  setInterval(async () => {
    try {
      await cronService.processNotifications();
      await cronService.processDailySubscriptions();
    } catch (e) {
      console.error('Background worker error:', e);
    }
  }, 30000); // Run every 30 seconds for easier testing
});

// Graceful shutdown to prevent EADDRINUSE (port already in use) errors when ts-node-dev restarts
const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });
  
  // Force close after 5 seconds if not closed gracefully
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Nodemon / ts-node-dev restart signal
