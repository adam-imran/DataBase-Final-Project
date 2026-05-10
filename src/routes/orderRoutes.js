const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.post('/',             ctrl.create);
router.put('/:id/status',    ctrl.updateStatus);

module.exports = router;
