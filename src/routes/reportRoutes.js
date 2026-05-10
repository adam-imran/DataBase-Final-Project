const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

router.get('/dashboard',              ctrl.dashboard);
router.get('/revenue-by-category',    ctrl.monthlyRevenueByCategory);   // Query 1
router.get('/top-products',           ctrl.topProducts);                 // Query 2
router.get('/high-spenders',          ctrl.highSpenders);                // Query 3
router.get('/low-stock',              ctrl.lowStockAlert);               // Query 4
router.get('/order-history',          ctrl.orderHistory);                // Query 5
router.get('/top-rated',              ctrl.topRatedProducts);            // Query 6

module.exports = router;
