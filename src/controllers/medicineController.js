const Medicine = require('../models/Medicine');

const listMedicines = async (req, res, next) => {
  try {
    const { search, category, manufacturer, expiryStatus, lowStock, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };

    const now = new Date();
    if (expiryStatus === 'expiring') {
      filter.expiryDate = { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
    } else if (expiryStatus === 'expired') {
      filter.expiryDate = { $lt: now };
    } else if (expiryStatus === 'active') {
      filter.expiryDate = { $gte: now };
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stock', '$reorderThreshold'] };
    }

    const sortObj = {};
    sortObj[sortBy] = order === 'desc' ? -1 : 1;

    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter)
      .populate('createdBy', 'name')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ medicines, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const createMedicine = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const medicine = await Medicine.create(data);
    res.status(201).json(medicine);
  } catch (error) {
    next(error);
  }
};

const getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('createdBy', 'name');
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json(medicine);
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json(medicine);
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json({ message: 'Medicine deactivated.' });
  } catch (error) {
    next(error);
  }
};

const getByBarcode = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ barcodeId: req.params.code, isActive: true })
      .select('name brand mrp stock gstSlab batchNo expiryDate');
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json(medicine);
  } catch (error) {
    next(error);
  }
};

const getExpiring = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const expiryLimit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const medicines = await Medicine.find({
      isActive: true,
      expiryDate: { $gte: now, $lte: expiryLimit }
    }).sort({ expiryDate: 1 });
    res.json(medicines);
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$reorderThreshold'] }
    }).sort({ stock: 1 });
    res.json(medicines);
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { stock, operation } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });

    if (operation === 'subtract') {
      if (medicine.stock < stock) return res.status(400).json({ message: 'Insufficient stock.' });
      medicine.stock -= stock;
    } else {
      medicine.stock += stock;
    }
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    next(error);
  }
};

module.exports = { listMedicines, createMedicine, getMedicine, updateMedicine, deleteMedicine, getByBarcode, getExpiring, getLowStock, adjustStock };
