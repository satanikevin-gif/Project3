const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Alert = require('../models/Alert');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalMedicines, totalBills, totalOrders, activeAlerts,
      lowStockCount, revenueResult
    ] = await Promise.all([
      Medicine.countDocuments({ isActive: true }),
      Bill.countDocuments(),
      Order.countDocuments(),
      Alert.countDocuments({ isAcknowledged: false }),
      Medicine.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$reorderThreshold'] } }),
      Bill.aggregate([
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ])
    ]);

    res.json({
      totalMedicines,
      totalBills,
      totalOrders,
      activeAlerts,
      lowStockCount,
      totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0
    });
  } catch (error) {
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }

    const bills = await Bill.find(filter).lean();
    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalBills = bills.length;
    const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

    const paymentBreakdown = {};
    bills.forEach(b => {
      paymentBreakdown[b.paymentMode] = (paymentBreakdown[b.paymentMode] || 0) + b.grandTotal;
    });

    const dailyRevenue = {};
    bills.forEach(b => {
      const date = new Date(b.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + b.grandTotal;
    });
    const dailyTrend = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));

    res.json({ totalRevenue, totalBills, avgBillValue, paymentBreakdown, dailyTrend });
  } catch (error) {
    next(error);
  }
};

const getTopMedicines = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await Bill.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalQty: { $sum: '$items.qty' },
        totalRevenue: { $sum: '$items.lineTotal' }
      }},
      { $sort: { totalQty: -1 } },
      { $limit: limit }
    ]);

    const topByQty = [...result].sort((a, b) => b.totalQty - a.totalQty);
    const topByRevenue = [...result].sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ topByQty, topByRevenue });
  } catch (error) {
    next(error);
  }
};

const getInventoryValue = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ isActive: true }).lean();
    let totalCost = 0, totalMrp = 0;
    medicines.forEach(m => {
      totalCost += m.stock * m.purchasePrice;
      totalMrp += m.stock * m.mrp;
    });
    const potentialProfit = totalMrp - totalCost;
    res.json({ totalCost, totalMrp, potentialProfit });
  } catch (error) {
    next(error);
  }
};

const getExpiryLoss = async (req, res, next) => {
  try {
    const now = new Date();
    const expired = await Medicine.find({ expiryDate: { $lt: now }, stock: { $gt: 0 } }).lean();
    const items = expired.map(m => ({
      name: m.name,
      batchNo: m.batchNo,
      expiryDate: m.expiryDate,
      stock: m.stock,
      purchasePrice: m.purchasePrice,
      lossValue: m.stock * m.purchasePrice
    }));
    const totalLossValue = items.reduce((sum, i) => sum + i.lossValue, 0);
    res.json({ items, totalLossValue });
  } catch (error) {
    next(error);
  }
};

const getProfitMargin = async (req, res, next) => {
  try {
    const results = await Bill.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.medicineId',
        medicineName: { $first: '$items.name' },
        totalRevenue: { $sum: '$items.lineTotal' }
      }}
    ]);

    const medicines = await Medicine.find().lean();
    const medMap = {};
    medicines.forEach(m => { medMap[m._id.toString()] = m; });

    const margins = results.map(r => {
      const med = medMap[r._id.toString()];
      const totalCost = med ? r.totalRevenue * (med.purchasePrice / med.mrp) : 0;
      const profit = r.totalRevenue - totalCost;
      const marginPercent = r.totalRevenue > 0 ? (profit / r.totalRevenue) * 100 : 0;
      return {
        medicineId: r._id,
        medicineName: r.medicineName,
        totalRevenue: r.totalRevenue,
        totalCost: Math.round(totalCost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        marginPercent: Math.round(marginPercent * 100) / 100
      };
    });

    res.json(margins);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getSales, getTopMedicines, getInventoryValue, getExpiryLoss, getProfitMargin };
