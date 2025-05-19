// Import the configured app and httpServer from app.js
const { app, httpServer } = require('./app');
const PORT = process.env.PORT || 3000;

// Start the server with Socket.io support
httpServer.listen(PORT, () => {
  console.log(`Server running with Socket.io on port ${PORT}`);
});
