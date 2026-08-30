const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { isMemory, getMemStore } = require('../config/db');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Accept token from Authorization header OR ?token= query param (for OAuth redirects)
  let token = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (isMemory()) {
      const user = getMemStore().users.find(u => u._id === decoded.id || u.id === decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;
    }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { auth, requireRole };
