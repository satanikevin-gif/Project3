const Alert = require('../models/Alert');
const Medicine = require('../models/Medicine');
const { sendEmail } = require('../utils/email');

const listAlerts = async (req, res, next) => {
  try {
    const { type, severity, acknowledged, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (acknowledged !== undefined) filter.isAcknowledged = acknowledged === 'true';

    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .populate('medicineId', 'name batchNo stock expiryDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ alerts, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isAcknowledged: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });
    res.json(alert);
  } catch (error) {
    next(error);
  }
};

const triggerAlertEngine = async (req, res, next) => {
  try {
    await runAlertEngine();
    res.json({ message: 'Alert engine executed.' });
  } catch (error) {
    next(error);
  }
};

const runAlertEngine = async () => {
  try {
    const medicines = await Medicine.find({ isActive: true });
    const now = new Date();
    const alerts = [];
    let criticalCount = 0, warningCount = 0, infoCount = 0;

    for (const med of medicines) {
      const daysToExpiry = Math.ceil((med.expiryDate - now) / (1000 * 60 * 60 * 24));

      if (daysToExpiry <= 0) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'expiry',
          severity: 'critical',
          message: `${med.name} (Batch: ${med.batchNo}) expired on ${med.expiryDate.toLocaleDateString()}.`
        });
        criticalCount++;
      } else if (daysToExpiry <= 7) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'expiry',
          severity: 'critical',
          message: `${med.name} (Batch: ${med.batchNo}) expires in ${daysToExpiry} days.`
        });
        criticalCount++;
      } else if (daysToExpiry <= 15) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'expiry',
          severity: 'warning',
          message: `${med.name} (Batch: ${med.batchNo}) expires in ${daysToExpiry} days.`
        });
        warningCount++;
      } else if (daysToExpiry <= 30) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'expiry',
          severity: 'info',
          message: `${med.name} (Batch: ${med.batchNo}) expires in ${daysToExpiry} days.`
        });
        infoCount++;
      }

      if (med.stock === 0) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'low_stock',
          severity: 'critical',
          message: `${med.name} is OUT OF STOCK. Reorder immediately.`
        });
        criticalCount++;
      } else if (med.stock <= med.reorderThreshold) {
        alerts.push({
          medicineId: med._id,
          medicineName: med.name,
          type: 'low_stock',
          severity: 'warning',
          message: `${med.name} has low stock: ${med.stock} units (threshold: ${med.reorderThreshold}).`
        });
        warningCount++;
      }
    }

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    const summary = `MediFlow Daily Alert Summary:\n\nCritical: ${criticalCount}\nWarning: ${warningCount}\nInfo: ${infoCount}\n\nTotal: ${alerts.length} alerts generated.`;
    console.log(summary);

    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `MediFlow Alert Digest - ${new Date().toLocaleDateString()}`,
      html: `<h2>MediFlow Daily Alert Digest</h2>
        <p><strong>Critical:</strong> ${criticalCount}</p>
        <p><strong>Warning:</strong> ${warningCount}</p>
        <p><strong>Info:</strong> ${infoCount}</p>
        <p>Total: ${alerts.length} alerts generated.</p>`
    });

    return { criticalCount, warningCount, infoCount, total: alerts.length };
  } catch (error) {
    console.error('Alert engine error:', error.message);
  }
};

module.exports = { listAlerts, acknowledgeAlert, triggerAlertEngine, runAlertEngine };
