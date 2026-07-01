const round2 = (val) => Math.round(val * 100) / 100;

const calculateGST = (mrp, qty, gstSlab) => {
  const total = mrp * qty;
  const baseAmount = round2(total / (1 + gstSlab / 100));
  const gstAmount = round2(total - baseAmount);
  return { baseAmount, gstAmount, total: round2(total) };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { round2, calculateGST, generateOTP };
