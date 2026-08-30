const { Router } = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/workflowController');

const router = Router();
router.use(auth);

router.get('/dashboard', c.getDashboard);
router.get('/', c.list);
router.post('/', [body('name').trim().notEmpty()], validate, c.create);
router.post('/generate', [body('prompt').trim().notEmpty()], validate, c.generate);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.post('/:id/duplicate', c.duplicate);
router.post('/:id/execute', c.execute);
router.delete('/:id', c.remove);

module.exports = router;
