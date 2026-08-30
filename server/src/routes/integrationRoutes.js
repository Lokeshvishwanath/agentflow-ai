const { Router } = require('express');
const { auth } = require('../middleware/auth');
const c = require('../controllers/integrationController');

const router = Router();

// OAuth callbacks are public (state carries userId)
router.get('/oauth/error', c.oauthError);
router.get('/oauth/:provider/callback', c.oauthCallback);

// All other routes require auth
router.use(auth);
router.get('/status', c.status);
router.get('/oauth/:provider/start', c.oauthStart);
router.get('/', c.list);
router.post('/', c.create);
router.delete('/:provider', c.disconnect);

module.exports = router;
