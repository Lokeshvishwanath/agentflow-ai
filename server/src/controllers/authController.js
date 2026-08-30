const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id || req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

module.exports = { register, login, me };
