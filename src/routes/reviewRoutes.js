const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');

router.get('/',    ctrl.getByProduct);
router.post('/',   ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
