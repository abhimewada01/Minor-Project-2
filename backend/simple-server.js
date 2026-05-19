import mysql from 'mysql2/promise';
import 'dotenv/config';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medical_system',
  waitForConnections: true,
  connectionLimit: 10
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Simple query helper
const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
};

// Simple Serverless Function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const method = req.method;

  try {
    // Health check endpoint
    if (method === 'GET' && url === '/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }

    // Get all medicines
    if (method === 'GET' && url === '/api/medicines') {
      const medicines = await query('SELECT * FROM medicines ORDER BY name');
      return res.status(200).json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    }

    // Get medicine by ID
    if (method === 'GET' && url.startsWith('/api/medicines/')) {
      const id = url.split('/')[3];
      const medicines = await query('SELECT * FROM medicines WHERE id = ?', [id]);
      if (medicines.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }
      return res.status(200).json({
        success: true,
        data: medicines[0]
      });
    }

    // Get all patients
    if (method === 'GET' && url === '/api/patients') {
      const patients = await query('SELECT id, name, email, phone, age, gender FROM patients ORDER BY name');
      return res.status(200).json({
        success: true,
        data: patients,
        count: patients.length
      });
    }

    // Create new bill
    if (method === 'POST' && url === '/api/bills') {
      const { patient_id, items, discount = 0, payment_method = 'Cash' } = req.body;
      
      if (!patient_id || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and items are required'
        });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = (subtotal * discount) / 100;
      const tax = (subtotal - discountAmount) * 0.1;
      const total = subtotal - discountAmount + tax;

      // Generate bill number
      const billNumber = `INV-${Date.now().toString().slice(-6)}`;

      // Insert bill
      const billResult = await query(
        'INSERT INTO bills (bill_number, patient_id, total_amount, discount, tax, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)',
        [billNumber, patient_id, total, discount, tax, payment_method, 'Paid']
      );

      const billId = billResult.insertId;

      // Insert bill items
      for (const item of items) {
        await query(
          'INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
          [billId, item.medicine_id, item.medicine_name, item.quantity, item.price, item.price * item.quantity]
        );
      }

      return res.status(201).json({
        success: true,
        data: {
          billId,
          billNumber,
          subtotal,
          discountAmount,
          tax,
          total
        },
        message: 'Bill created successfully'
      });
    }

    // Get bills
    if (method === 'GET' && url === '/api/bills') {
      const bills = await query(`
        SELECT b.*, p.name as patient_name 
        FROM bills b 
        LEFT JOIN patients p ON b.patient_id = p.id 
        ORDER BY b.created_at DESC 
        LIMIT 50
      `);
      
      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length
      });
    }

    // Get dashboard stats
    if (method === 'GET' && url === '/api/dashboard/stats') {
      const [medicineCount] = await query('SELECT COUNT(*) as count FROM medicines');
      const [patientCount] = await query('SELECT COUNT(*) as count FROM patients');
      const [billCount] = await query('SELECT COUNT(*) as count FROM bills');
      const [totalRevenue] = await query('SELECT SUM(total_amount) as total FROM bills WHERE status = "Paid"');

      return res.status(200).json({
        success: true,
        data: {
          totalMedicines: medicineCount[0].count,
          totalPatients: patientCount[0].count,
          totalBills: billCount[0].count,
          totalRevenue: totalRevenue[0].total || 0
        }
      });
    }

    // 404 for unknown routes
    return res.status(404).json({
      success: false,
      message: 'Route not found',
      available_routes: [
        'GET /health',
        'GET /api/medicines',
        'GET /api/medicines/:id',
        'GET /api/patients',
        'POST /api/bills',
        'GET /api/bills',
        'GET /api/dashboard/stats'
      ]
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
