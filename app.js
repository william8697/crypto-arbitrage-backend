io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Listen for new trades
  socket.on('newTrade', async (tradeData) => {
    try {
      // Save trade to database
      const trade = await Trade.create(tradeData);
      
      // Update user balance
      await User.findByIdAndUpdate(tradeData.userId, {
        $inc: { balance: tradeData.profit || -tradeData.amount },
        $push: { tradingHistory: trade._id }
      });
      
      // Broadcast to all clients (admin dashboard)
      io.emit('tradeActivity', trade);
      
      // Notify specific user
      io.to(`user_${tradeData.userId}`).emit('balanceUpdate', {
        userId: tradeData.userId,
        newBalance: await getUpdatedBalance(tradeData.userId)
      });
    } catch (err) {
      console.error('Trade error:', err);
    }
  });
  
  // Join user-specific room for private updates
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});