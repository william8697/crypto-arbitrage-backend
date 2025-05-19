const express = require('express');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Protect and restrict to admin
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/trades', adminController.getAllTrades);
router.get('/activities', adminController.getRecentActivities);
router.patch('/users/:id/balance', adminController.updateUserBalance);

module.exports = router;