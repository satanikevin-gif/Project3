require('dotenv').config();
const mongoose = require('mongoose');
const { User, Medicine, Supplier, Counter } = require('./models');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      Medicine.deleteMany({}),
      Supplier.deleteMany({}),
      Counter.deleteMany({})
    ]);
    console.log('Cleared existing data.');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@mediflow.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
      address: { street: '123 Pharmacy Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
    });
    console.log('Admin created: admin@mediflow.com / admin123');

    const customer = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '9876543211',
      password: 'customer123',
      role: 'customer',
      address: { street: '45 Park Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400002' },
      loyaltyPoints: 50
    });
    console.log('Customer created: rahul@example.com / customer123');

    const supplierUser = await User.create({
      name: 'Rajesh Suppliers',
      email: 'rajesh@supplier.com',
      phone: '9876543212',
      password: 'supplier123',
      role: 'supplier',
      address: { street: '88 Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400003' }
    });
    console.log('Supplier user created: rajesh@supplier.com / supplier123');

    const supplier = await Supplier.create({
      name: 'Rajesh Suppliers',
      company: 'Rajesh Pharmaceuticals Pvt Ltd',
      email: 'rajesh@supplier.com',
      phone: '9876543212',
      address: { street: '88 Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400003' },
      gstNumber: '27AABCU9603R1Z1',
      categories: ['tablets', 'syrup', 'injection']
    });
    console.log('Supplier record created.');

    const medicines = await Medicine.create([
      {
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        brand: 'Cipmol',
        manufacturer: 'Cipla',
        category: 'tablets',
        batchNo: 'B2024001',
        mfgDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-15'),
        unit: 'strip',
        packSize: 10,
        mrp: 30,
        purchasePrice: 18,
        stock: 100,
        reorderThreshold: 20,
        rackLocation: 'A-1',
        gstSlab: 12,
        createdBy: admin._id
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        brand: 'Mox',
        manufacturer: 'Sun Pharma',
        category: 'tablets',
        batchNo: 'B2024002',
        mfgDate: new Date('2024-03-01'),
        expiryDate: new Date('2025-03-01'),
        unit: 'strip',
        packSize: 10,
        mrp: 85,
        purchasePrice: 52,
        stock: 50,
        reorderThreshold: 15,
        rackLocation: 'A-2',
        gstSlab: 12,
        createdBy: admin._id
      },
      {
        name: 'Cough Syrup DM',
        genericName: 'Dextromethorphan',
        brand: 'Cough-X',
        manufacturer: 'Abbott',
        category: 'syrup',
        batchNo: 'B2024003',
        mfgDate: new Date('2024-02-01'),
        expiryDate: new Date('2026-02-01'),
        unit: 'bottle',
        packSize: 100,
        mrp: 120,
        purchasePrice: 72,
        stock: 30,
        reorderThreshold: 10,
        rackLocation: 'B-1',
        gstSlab: 18,
        createdBy: admin._id
      },
      {
        name: 'Insulin Regular 40IU',
        genericName: 'Insulin',
        brand: 'Insogen',
        manufacturer: 'Biocon',
        category: 'injection',
        batchNo: 'B2024004',
        mfgDate: new Date('2024-06-01'),
        expiryDate: new Date('2025-12-01'),
        unit: 'bottle',
        packSize: 10,
        mrp: 450,
        purchasePrice: 310,
        stock: 5,
        reorderThreshold: 10,
        rackLocation: 'C-1',
        gstSlab: 5,
        createdBy: admin._id
      },
      {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine',
        brand: 'Zyrtec',
        manufacturer: 'Dr Reddy\'s',
        category: 'tablets',
        batchNo: 'B2024005',
        mfgDate: new Date('2024-04-01'),
        expiryDate: new Date('2026-04-01'),
        unit: 'strip',
        packSize: 10,
        mrp: 25,
        purchasePrice: 14,
        stock: 200,
        reorderThreshold: 30,
        rackLocation: 'A-3',
        gstSlab: 12,
        createdBy: admin._id
      },
      {
        name: 'Multivitamin Tablets',
        genericName: 'Multivitamin',
        brand: 'Supradyn',
        manufacturer: 'Bayer',
        category: 'tablets',
        batchNo: 'B2024006',
        mfgDate: new Date('2024-05-01'),
        expiryDate: new Date('2026-05-01'),
        unit: 'strip',
        packSize: 15,
        mrp: 180,
        purchasePrice: 108,
        stock: 75,
        reorderThreshold: 15,
        rackLocation: 'A-4',
        gstSlab: 12,
        createdBy: admin._id
      },
      {
        name: 'Eye Drops - Moisture Plus',
        genericName: 'Carboxymethylcellulose',
        brand: 'Moist-E',
        manufacturer: 'Alcon',
        category: 'drops',
        batchNo: 'B2024007',
        mfgDate: new Date('2024-07-01'),
        expiryDate: new Date('2025-07-01'),
        unit: 'bottle',
        packSize: 10,
        mrp: 95,
        purchasePrice: 57,
        stock: 40,
        reorderThreshold: 10,
        rackLocation: 'D-1',
        gstSlab: 12,
        createdBy: admin._id
      },
      {
        name: 'Aspirin 75mg',
        genericName: 'Aspirin',
        brand: 'Ecosprin',
        manufacturer: 'USV',
        category: 'tablets',
        batchNo: 'B2024008',
        mfgDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        unit: 'strip',
        packSize: 14,
        mrp: 35,
        purchasePrice: 20,
        stock: 0,
        reorderThreshold: 25,
        rackLocation: 'A-5',
        gstSlab: 5,
        createdBy: admin._id
      }
    ]);
    console.log(`${medicines.length} medicines seeded.`);

    await Counter.create([
      { name: 'billNo', value: 0 },
      { name: 'poNumber', value: 0 },
      { name: 'orderNo', value: 0 }
    ]);
    console.log('Counters initialized.');

    console.log('\n--- SEED COMPLETE ---');
    console.log('Admin: admin@mediflow.com / admin123');
    console.log('Customer: rahul@example.com / customer123');
    console.log('Supplier: rajesh@supplier.com / supplier123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
