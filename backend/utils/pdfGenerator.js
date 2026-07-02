const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateInvoicePDF = (bill) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `invoice-${bill.billNo}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(22).font('Helvetica-Bold').text('MediFlow Pharmacy', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('123 Health Street, Medical District', { align: 'center' });
    doc.text('GSTIN: 07AABCU9603R1Z1 | DL: 07/BIO/12345', { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).font('Helvetica-Bold').text('GST INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    doc.text(`Bill No: ${bill.billNo}`);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`);
    doc.text(`Customer: ${bill.customerName}`);
    if (bill.customerPhone) doc.text(`Phone: ${bill.customerPhone}`);
    doc.moveDown();

    const tableTop = doc.y;
    const col1 = 50, col2 = 180, col3 = 280, col4 = 340, col5 = 400, col6 = 470, col7 = 530;
    const rowHeight = 20;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('#', col1, tableTop);
    doc.text('Item', col2, tableTop);
    doc.text('Qty', col3, tableTop);
    doc.text('MRP', col4, tableTop);
    doc.text('GST', col5, tableTop);
    doc.text('Total', col6, tableTop);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    let y = doc.y;
    bill.items.forEach((item, i) => {
      doc.text((i + 1).toString(), col1, y);
      doc.text(item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name, col2, y);
      doc.text(item.qty.toString(), col3, y);
      doc.text(item.mrp.toFixed(2), col4, y);
      doc.text(item.gstSlab + '%', col5, y);
      doc.text(item.lineTotal.toFixed(2), col6, y);
      y += rowHeight;
    });

    doc.moveDown();
    const summaryY = Math.max(y + 10, doc.y + 10);
    doc.fontSize(10);
    doc.text(`Subtotal: Rs. ${bill.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (0%): Rs. ${bill.gstBreakup.slab0.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (5%): Rs. ${bill.gstBreakup.slab5.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (12%): Rs. ${bill.gstBreakup.slab12.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (18%): Rs. ${bill.gstBreakup.slab18.toFixed(2)}`, { align: 'right' });
    doc.text(`Total GST: Rs. ${bill.gstTotal.toFixed(2)}`, { align: 'right' });
    if (bill.discount > 0) doc.text(`Discount: Rs. ${bill.discount.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Grand Total: Rs. ${bill.grandTotal.toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(8).font('Helvetica').text('This is a computer-generated invoice.', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generateInvoicePDF };
