const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { isMemory, getMemStore } = require('../config/db');
const Notification = require('../models/Notification');

const router = Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    let notifications;
    if (isMemory()) {
      notifications = getMemStore().notifications.filter(n => n.owner === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
    } else {
      notifications = await Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(50);
    }
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    if (isMemory()) {
      const n = getMemStore().notifications.find(n => n._id === req.params.id && n.owner === userId);
      if (n) n.isRead = true;
    } else {
      await Notification.findOneAndUpdate({ _id: req.params.id, owner: userId }, { isRead: true });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    if (isMemory()) {
      getMemStore().notifications.filter(n => n.owner === userId).forEach(n => n.isRead = true);
    } else {
      await Notification.updateMany({ owner: userId }, { isRead: true });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
