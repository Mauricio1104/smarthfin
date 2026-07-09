const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { list, create, update, remove } = require('../controllers/transactionController');

router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
