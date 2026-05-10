const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

router.get('/',            ctrl.getAll);
router.get('/low-stock',   ctrl.getLowStock);
router.get('/:id',         ctrl.getOne);
router.post('/',           ctrl.create);
router.put('/:id',         ctrl.update);
router.post('/:id/stock',  ctrl.adjustStock);
router.delete('/:id',      ctrl.remove);

module.exports = router;
