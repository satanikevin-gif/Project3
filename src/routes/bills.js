const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const billController = require('../controllers/billController');

router.use(authenticate, authorise('admin'));

router.post('/', billController.createBill);
router.get('/', billController.listBills);
router.get('/:id', billController.getBill);
router.get('/:id/pdf', billController.getBillPDF);

module.exports = router;
