const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const GRN = require('../models/GRN');
const Medicine = require('../models/Medicine');
const Counter = require('../models/Counter');
const { sendEmail } = require('../utils/email');

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

const listSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json({ message: 'Supplier deactivated.' });
  } catch (error) {
    next(error);
  }
};

const createPO = async (req, res, next) => {
  try {
    const { supplierId, items, expectedDelivery, notes } = req.body;
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    const poNumber = 'PO-' + String(await Counter.getNextSequence('poNumber')).padStart(6, '0');

    const po = await PurchaseOrder.create({
      poNumber,
      supplierId,
      supplierName: supplier.name,
      items,
      expectedDelivery,
      notes,
      createdBy: req.user._id
    });

    sendEmail({
      to: supplier.email,
      subject: `Purchase Order ${poNumber} from MediFlow`,
      html: `<h2>Purchase Order: ${poNumber}</h2>
        <p>Dear ${supplier.name},</p>
        <p>A new purchase order has been created. Please review the items below:</p>
        <ul>${items.map(i => `<li>${i.medicineName} - Qty: ${i.quantity}</li>`).join('')}</ul>
        ${expectedDelivery ? `<p>Expected Delivery: ${new Date(expectedDelivery).toLocaleDateString()}</p>` : ''}
        <p>Please log in to your supplier portal to respond.</p>`
    }).catch(() => {});

    res.status(201).json(po);
  } catch (error) {
    next(error);
  }
};

const listPOs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await PurchaseOrder.countDocuments(filter);
    const pos = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name company email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ purchaseOrders: pos, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const updatePOStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!po) return res.status(404).json({ message: 'Purchase order not found.' });
    res.json(po);
  } catch (error) {
    next(error);
  }
};

const createGRN = async (req, res, next) => {
  try {
    const { poId, items, notes } = req.body;
    const po = await PurchaseOrder.findById(poId).populate('supplierId');
    if (!po) return res.status(404).json({ message: 'Purchase order not found.' });

    for (const item of items) {
      await Medicine.findByIdAndUpdate(item.medicineId, { $inc: { stock: item.receivedQty } });
    }

    const grn = await GRN.create({
      poId,
      supplierId: po.supplierId._id,
      items,
      notes,
      receivedBy: req.user._id
    });

    po.status = 'received';
    await po.save();

    res.status(201).json(grn);
  } catch (error) {
    next(error);
  }
};

const listGRNs = async (req, res, next) => {
  try {
    const grns = await GRN.find()
      .populate('supplierId', 'name company')
      .populate('poId', 'poNumber')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(grns);
  } catch (error) {
    next(error);
  }
};

const getMyPOs = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ email: req.user.email });
    if (!supplier) return res.status(404).json({ message: 'Supplier profile not found for your account.' });
    const pos = await PurchaseOrder.find({ supplierId: supplier._id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    next(error);
  }
};

const respondToPO = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'You can only accept or reject a PO.' });
    }
    const supplier = await Supplier.findOne({ email: req.user.email });
    if (!supplier) return res.status(404).json({ message: 'Supplier profile not found.' });
    const po = await PurchaseOrder.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!po) return res.status(404).json({ message: 'Purchase order not found.' });
    if (po.status !== 'pending') return res.status(400).json({ message: 'PO has already been responded to.' });
    po.status = status;
    await po.save();
    res.json(po);
  } catch (error) {
    next(error);
  }
};

module.exports = { createSupplier, listSuppliers, getSupplier, updateSupplier, deleteSupplier, createPO, listPOs, updatePOStatus, createGRN, listGRNs, getMyPOs, respondToPO };
