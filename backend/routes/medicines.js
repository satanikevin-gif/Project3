const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const medicineController = require('../controllers/medicineController');

router.use(authenticate, authorise('admin'));

router.get('/', medicineController.listMedicines);
router.post('/', medicineController.createMedicine);
router.get('/expiring', medicineController.getExpiring);
router.get('/low-stock', medicineController.getLowStock);
router.get('/barcode/:code', medicineController.getByBarcode);
router.get('/:id', medicineController.getMedicine);
router.put('/:id', medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);
router.patch('/:id/stock', medicineController.adjustStock);

module.exports = router;
