const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate, authorise('admin'));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/sales', analyticsController.getSales);
router.get('/top-medicines', analyticsController.getTopMedicines);
router.get('/inventory-value', analyticsController.getInventoryValue);
router.get('/expiry-loss', analyticsController.getExpiryLoss);
router.get('/profit-margin', analyticsController.getProfitMargin);

module.exports = router;
