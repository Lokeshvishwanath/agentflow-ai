const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { isMemory, getMemStore } = require('../config/db');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const signToken = (id) => jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiresIn });

const register = async ({ name, email, password }) => {
  if (isMemory()) {
    const store = getMemStore();
    if (store.users.find(u => u.email === email)) {
      throw Object.assign(new Error('Email already registered'), { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = { _id: uuidv4(), id: uuidv4(), name, email, password: hashed, role: 'operator', createdAt: new Date() };
    user.id = user._id;
    store.users.push(user);
    const token = signToken(user._id);
    const { password: _, ...safe } = user;
    return { token, user: safe };
  }
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  if (isMemory()) {
    const store = getMemStore();
    const user = store.users.find(u => u.email === email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    user.lastLogin = new Date();
    const token = signToken(user._id);
    const { password: _, ...safe } = user;
    return { token, user: safe };
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const match = await user.comparePassword(password);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  user.lastLogin = new Date();
  await user.save();
  const token = signToken(user._id);
  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

const getMe = async (userId) => {
  if (isMemory()) {
    const user = getMemStore().users.find(u => u._id === userId || u.id === userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const { password: _, ...safe } = user;
    return safe;
  }
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
};

module.exports = { register, login, getMe };
