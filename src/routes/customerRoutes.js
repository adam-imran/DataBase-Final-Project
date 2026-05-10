const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');

router.get('/',             ctrl.getAll);
router.get('/:id',          ctrl.getOne);
router.post('/register',    ctrl.register);
router.post('/login',       ctrl.login);
router.put('/:id',          ctrl.update);
router.post('/:id/addresses', ctrl.addAddress);
router.delete('/:id',       ctrl.remove);

module.exports = router;
