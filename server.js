const { httpServer } = require('./app');  // Destructure only what you need
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running with Socket.io on port ${PORT}`);
});
