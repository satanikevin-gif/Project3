const multer = require('multer');
const path = require('path');

const prescriptionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'prescriptions'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rx-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPrescription = multer({
  storage: prescriptionStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG/PNG/GIF) and PDF files are allowed.'));
    }
  }
});

module.exports = { uploadPrescription };
