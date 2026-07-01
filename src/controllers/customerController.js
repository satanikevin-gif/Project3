const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { sendEmail } = require('../utils/email');

const listCustomerMedicines = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, stock: { $gt: 0 } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;

    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter)
      .select('name genericName brand manufacturer category unit packSize mrp stock gstSlab')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ medicines, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const placeOrder = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    let { items, deliveryAddress, loyaltyPointsToUse } = req.body;

    if (req.file) {
      req.body = { ...req.body, prescriptionUrl: req.file.path };
    }

    if (typeof items === 'string') items = JSON.parse(items);
    if (typeof deliveryAddress === 'string') deliveryAddress = JSON.parse(deliveryAddress);
    loyaltyPointsToUse = parseInt(loyaltyPointsToUse) || 0;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    const customer = await User.findById(customerId);
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const medicine = await Medicine.findOne({ _id: item.medicineId, isActive: true, stock: { $gte: item.qty } });
      if (!medicine) {
        return res.status(400).json({ message: `Medicine ${item.medicineId} unavailable or insufficient stock.` });
      }
      const lineTotal = medicine.mrp * item.qty;
      totalAmount += lineTotal;
      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        qty: item.qty,
        mrp: medicine.mrp,
        lineTotal
      });
    }

    const maxLoyaltyDiscount = Math.min(loyaltyPointsToUse, customer.loyaltyPoints, Math.floor(totalAmount));
    totalAmount -= maxLoyaltyDiscount;

    const orderNo = 'ORD-' + String(await Counter.getNextSequence('orderNo')).padStart(6, '0');
    const loyaltyPointsEarned = Math.floor(totalAmount / 10);

    const order = await Order.create({
      orderNo,
      customerId,
      items: orderItems,
      prescriptionUrl: req.file ? req.file.path : '',
      totalAmount,
      loyaltyPointsUsed: maxLoyaltyDiscount,
      loyaltyPointsEarned,
      deliveryAddress,
      status: 'pending',
      paymentStatus: 'pending'
    });

    customer.loyaltyPoints = customer.loyaltyPoints - maxLoyaltyDiscount + loyaltyPointsEarned;
    await customer.save();

    sendEmail({
      to: customer.email,
      subject: `Order Confirmed - ${orderNo}`,
      html: `<h2>Order Placed Successfully!</h2>
        <p>Dear ${customer.name},</p>
        <p>Your order <strong>${orderNo}</strong> has been placed.</p>
        <p>Total Amount: Rs. ${totalAmount}</p>
        <p>We will notify you when the order is confirmed.</p>`
    }).catch(() => {});

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const listAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = status;
    await order.save();

    if (status === 'confirmed') {
      for (const item of order.items) {
        await Medicine.findByIdAndUpdate(item.medicineId, { $inc: { stock: -item.qty } });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(order.customerId.toString()).emit('orderStatusUpdate', {
        orderId: order._id,
        orderNo: order.orderNo,
        status: order.status
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { listCustomerMedicines, placeOrder, getMyOrders, getOrderStatus, listAllOrders, updateOrderStatus };
