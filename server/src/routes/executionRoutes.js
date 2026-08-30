const { Router } = require('express');
const { auth } = require('../middleware/auth');
const c = require('../controllers/executionController');

const router = Router();
router.use(auth);

router.get('/', c.list);
router.get('/:id', c.getOne);
router.get('/:id/timeline', c.getTimeline);
router.post('/:id/pause', c.pause);
router.post('/:id/resume', c.resume);
router.post('/:id/cancel', c.cancel);

module.exports = router;
