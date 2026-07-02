const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const supplierController = require('../controllers/supplierController');

// Supplier self-service routes (supplier or admin)
router.get('/my-pos', authenticate, supplierController.getMyPOs);
router.patch('/po/:id/respond', authenticate, supplierController.respondToPO);

// Admin-only routes
router.use(authenticate, authorise('admin'));

router.post('/', supplierController.createSupplier);
router.get('/', supplierController.listSuppliers);
router.get('/:id', supplierController.getSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);
router.post('/po/create', supplierController.createPO);
router.get('/po/all', supplierController.listPOs);
router.patch('/po/:id/status', supplierController.updatePOStatus);
router.post('/grn/create', supplierController.createGRN);
router.get('/grn/all', supplierController.listGRNs);

module.exports = router;
