const jwt = require('jsonwebtoken');
const User = require('/models/User');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, country, walletAddress, walletType } = req.body;
    
    // Check if email or wallet already exists
    const existingUser = walletAddress 
      ? await User.findOne({ $or: [{ email }, { walletAddress }] })
      : await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: walletAddress ? 'Wallet or email already in use' : 'Email already in use'
      });
    }
    
    const newUser = await User.create({
      fullName,
      email,
      password: walletAddress ? undefined : password,
      country,
      walletAddress,
      walletType
    });
    
    const token = signToken(newUser._id);
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          walletAddress: newUser.walletAddress,
          balance: newUser.balance
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, walletAddress, signature } = req.body;
    
    let user;
    if (walletAddress) {
      // Wallet-based login
      user = await User.findOne({ walletAddress });
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'No account found with this wallet'
        });
      }
      // In production, verify the signature here
    } else {
      // Email/password login
      if (!email || !password) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide email and password'
        });
      }
      
      user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.correctPassword(password, user.password))) {
        return res.status(401).json({
          status: 'fail',
          message: 'Incorrect email or password'
        });
      }
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    const token = signToken(user._id);
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          walletAddress: user.walletAddress,
          balance: user.balance
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }
    
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
  }
};