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

// HTTP Server
const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers, status: 200 });
    }

    try {
      let body = null;
      if (method === 'POST' || method === 'PUT') {
        body = await req.json();
      }

      // Health check endpoint
      if (method === 'GET' && url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }), { headers, status: 200 });
      }

      // Get all medicines
      if (method === 'GET' && url.pathname === '/api/medicines') {
        const medicines = await query('SELECT * FROM medicines ORDER BY name');
        return new Response(JSON.stringify({
          success: true,
          data: medicines,
          count: medicines.length
        }), { headers, status: 200 });
      }

      // Get medicine by ID
      if (method === 'GET' && url.pathname.startsWith('/api/medicines/')) {
        const id = url.pathname.split('/')[3];
        const medicines = await query('SELECT * FROM medicines WHERE id = ?', [id]);
        if (medicines.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Medicine not found'
          }), { headers, status: 404 });
        }
        return new Response(JSON.stringify({
          success: true,
          data: medicines[0]
        }), { headers, status: 200 });
      }

      // Get all patients
      if (method === 'GET' && url.pathname === '/api/patients') {
        const patients = await query('SELECT id, name, email, phone, age, gender FROM patients ORDER BY name');
        return new Response(JSON.stringify({
          success: true,
          data: patients,
          count: patients.length
        }), { headers, status: 200 });
      }

      // Create new bill
      if (method === 'POST' && url.pathname === '/api/bills') {
        const { patient_id, items, discount = 0, payment_method = 'Cash' } = body;
        
        if (!patient_id || !items || items.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Patient ID and items are required'
          }), { headers, status: 400 });
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
          'INSERT INTO bills (bill_number, patient_id, total_amount, discount, tax, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [billNumber, patient_id, total, discount, tax, payment_method, 'Paid']
        );

        const billId = billResult.insertId;

        // Insert bill items
        for (const item of items) {
          await query(
            'INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)',
            [billId, item.medicine_id, item.medicine_name, item.quantity, item.price, item.price * item.quantity]
          );
        }

        return new Response(JSON.stringify({
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
        }), { headers, status: 201 });
      }

      // Get bills
      if (method === 'GET' && url.pathname === '/api/bills') {
        const bills = await query(`
          SELECT b.*, p.name as patient_name 
          FROM bills b 
          LEFT JOIN patients p ON b.patient_id = p.id 
          ORDER BY b.created_at DESC 
          LIMIT 50
        `);
        
        return new Response(JSON.stringify({
          success: true,
          data: bills,
          count: bills.length
        }), { headers, status: 200 });
      }

      // Get dashboard stats
      if (method === 'GET' && url.pathname === '/api/dashboard/stats') {
        const [medicineCount] = await query('SELECT COUNT(*) as count FROM medicines');
        const [patientCount] = await query('SELECT COUNT(*) as count FROM patients');
        const [billCount] = await query('SELECT COUNT(*) as count FROM bills');
        const [totalRevenue] = await query('SELECT SUM(total_amount) as total FROM bills WHERE status = "Paid"');

        return new Response(JSON.stringify({
          success: true,
          data: {
            totalMedicines: medicineCount[0].count,
            totalPatients: patientCount[0].count,
            totalBills: billCount[0].count,
            totalRevenue: totalRevenue[0].total || 0
          }
        }), { headers, status: 200 });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
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
      }), { headers, status: 404 });

    } catch (error) {
      console.error('Server error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      }), { headers, status: 500 });
    }
  },
});

console.log(`🚀 Simple Medical Backend Server running on http://localhost:${server.port}`);
console.log(`📊 Available endpoints:`);
console.log(`   GET /health - Health check`);
console.log(`   GET /api/medicines - Get all medicines`);
console.log(`   GET /api/medicines/:id - Get medicine by ID`);
console.log(`   GET /api/patients - Get all patients`);
console.log(`   POST /api/bills - Create new bill`);
console.log(`   GET /api/bills - Get bills`);
console.log(`   GET /api/dashboard/stats - Dashboard statistics`);
