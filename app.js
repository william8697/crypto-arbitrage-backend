const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Trade = require('./models/Trade');  // Make sure to import your models
const User = require('./models/User');

// Helper function (must be defined or imported)
async function getUpdatedBalance(userId) {
  const user = await User.findById(userId);
  return user.balance;
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('newTrade', async (tradeData) => {
    try {
      const trade = await Trade.create(tradeData);
      await User.findByIdAndUpdate(tradeData.userId, {
        $inc: { balance: tradeData.profit || -tradeData.amount },
        $push: { tradingHistory: trade._id }
      });
      
      io.emit('tradeActivity', trade);
      io.to(`user_${tradeData.userId}`).emit('balanceUpdate', {
        userId: tradeData.userId,
        newBalance: await getUpdatedBalance(tradeData.userId)
      });
    } catch (err) {
      console.error('Trade error:', err);
    }
  });
  
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Add this export at the bottom
module.exports = { app, httpServer };
