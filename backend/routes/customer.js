const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const { uploadPrescription } = require('../middlewares/upload');
const customerController = require('../controllers/customerController');

router.get('/medicines', authenticate, customerController.listCustomerMedicines);
router.post('/orders', authenticate, uploadPrescription.single('prescription'), customerController.placeOrder);
router.get('/orders/my', authenticate, customerController.getMyOrders);
router.get('/orders/:id/status', authenticate, customerController.getOrderStatus);
router.get('/orders/all', authenticate, authorise('admin'), customerController.listAllOrders);
router.patch('/orders/:id/status', authenticate, authorise('admin'), customerController.updateOrderStatus);

module.exports = router;
