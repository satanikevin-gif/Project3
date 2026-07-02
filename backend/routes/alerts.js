const router = require('express').Router();
const { authenticate, authorise } = require('../middlewares/auth');
const alertController = require('../controllers/alertController');

router.use(authenticate, authorise('admin'));

router.get('/', alertController.listAlerts);
router.patch('/:id/ack', alertController.acknowledgeAlert);
router.post('/trigger', alertController.triggerAlertEngine);

module.exports = router;
