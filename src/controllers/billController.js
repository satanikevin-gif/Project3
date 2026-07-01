const Bill = require('../models/Bill');
const Medicine = require('../models/Medicine');
const Counter = require('../models/Counter');
const { round2, calculateGST } = require('../utils/helpers');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/email');

const createBill = async (req, res, next) => {
  try {
    const { customerId, customerName, customerPhone, items, discount = 0, paymentMode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const billItems = [];
    let subtotal = 0;
    const gstBreakup = { slab0: 0, slab5: 0, slab12: 0, slab18: 0 };

    for (const item of items) {
      const medicine = await Medicine.findOneAndUpdate(
        { _id: item.medicineId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );
      if (!medicine) {
        return res.status(400).json({ message: `Insufficient stock for medicine ID: ${item.medicineId}` });
      }

      const { baseAmount, gstAmount, total } = calculateGST(medicine.mrp, item.qty, medicine.gstSlab);

      billItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        batchNo: medicine.batchNo,
        expiryDate: medicine.expiryDate,
        qty: item.qty,
        mrp: medicine.mrp,
        gstSlab: medicine.gstSlab,
        gstAmount,
        lineTotal: total
      });

      subtotal += total;
      const slabKey = `slab${medicine.gstSlab}`;
      gstBreakup[slabKey] = round2((gstBreakup[slabKey] || 0) + gstAmount);
    }

    subtotal = round2(subtotal);
    const gstTotal = round2(gstBreakup.slab0 + gstBreakup.slab5 + gstBreakup.slab12 + gstBreakup.slab18);
    const grandTotal = round2(subtotal - discount);

    const billNo = 'BILL-' + String(await Counter.getNextSequence('billNo')).padStart(6, '0');

    const bill = await Bill.create({
      billNo,
      customerId: customerId || null,
      customerName,
      customerPhone,
      items: billItems,
      subtotal,
      gstBreakup,
      gstTotal,
      discount,
      grandTotal,
      paymentMode,
      createdBy: req.user._id
    });

    generateInvoicePDF(bill).then(pdfPath => {
      Bill.findByIdAndUpdate(bill._id, { invoicePdfUrl: pdfPath }).catch(() => {});
      if (customerId) {
        sendEmail({
          to: req.body.customerEmail,
          subject: `Invoice ${billNo} from MediFlow`,
          html: `<p>Dear ${customerName},</p><p>Your invoice <strong>${billNo}</strong> of Rs.${grandTotal} is attached.</p>`
        }).catch(() => {});
      }
    }).catch(err => console.error('PDF generation failed:', err));

    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
};

const listBills = async (req, res, next) => {
  try {
    const { from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }
    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter)
      .populate('createdBy', 'name')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ bills, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('customerId', 'name email phone');
    if (!bill) return res.status(404).json({ message: 'Bill not found.' });
    res.json(bill);
  } catch (error) {
    next(error);
  }
};

const getBillPDF = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found.' });
    if (!bill.invoicePdfUrl) {
      return res.status(404).json({ message: 'PDF not generated yet.' });
    }
    res.download(bill.invoicePdfUrl, `invoice-${bill.billNo}.pdf`);
  } catch (error) {
    next(error);
  }
};

module.exports = { createBill, listBills, getBill, getBillPDF };
