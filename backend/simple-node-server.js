import http from 'http';
import mysql from 'mysql2/promise';
import url from 'url';
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
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', reject);
      });
    }

    // Health check endpoint
    if (method === 'GET' && pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
      return;
    }

    // Get all medicines
    if (method === 'GET' && pathname === '/api/medicines') {
      const medicines = await query('SELECT * FROM medicines ORDER BY name');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: medicines,
        count: medicines.length
      }));
      return;
    }

    // Get medicine by ID
    if (method === 'GET' && pathname.startsWith('/api/medicines/')) {
      const id = pathname.split('/')[3];
      const medicines = await query('SELECT * FROM medicines WHERE id = ?', [id]);
      if (medicines.length === 0) {
        res.writeHead(404);
        res.end(JSON.stringify({
          success: false,
          message: 'Medicine not found'
        }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: medicines[0]
      }));
      return;
    }

    // Get all patients
    if (method === 'GET' && pathname === '/api/patients') {
      const patients = await query('SELECT id, name, email, phone, age, gender FROM patients ORDER BY name');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: patients,
        count: patients.length
      }));
      return;
    }

    // Create new bill
    if (method === 'POST' && pathname === '/api/bills') {
      const { patient_id, items, discount = 0, payment_method = 'Cash' } = body;
      
      if (!patient_id || !items || items.length === 0) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: 'Patient ID and items are required'
        }));
        return;
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

      res.writeHead(201);
      res.end(JSON.stringify({
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
      }));
      return;
    }

    // Get bills
    if (method === 'GET' && pathname === '/api/bills') {
      const bills = await query(`
        SELECT b.*, p.name as patient_name 
        FROM bills b 
        LEFT JOIN patients p ON b.patient_id = p.id 
        ORDER BY b.created_at DESC 
        LIMIT 50
      `);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: bills,
        count: bills.length
      }));
      return;
    }

    // Get dashboard stats
    if (method === 'GET' && pathname === '/api/dashboard/stats') {
      const [medicineCount] = await query('SELECT COUNT(*) as count FROM medicines');
      const [patientCount] = await query('SELECT COUNT(*) as count FROM patients');
      const [billCount] = await query('SELECT COUNT(*) as count FROM bills');
      const [totalRevenue] = await query('SELECT SUM(total_amount) as total FROM bills WHERE status = "Paid"');

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          totalMedicines: medicineCount[0].count,
          totalPatients: patientCount[0].count,
          totalBills: billCount[0].count,
          totalRevenue: totalRevenue[0].total || 0
        }
      }));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404);
    res.end(JSON.stringify({
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
    }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Simple Medical Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /api/medicines - Get all medicines`);
  console.log(`   GET /api/medicines/:id - Get medicine by ID`);
  console.log(`   GET /api/patients - Get all patients`);
  console.log(`   POST /api/bills - Create new bill`);
  console.log(`   GET /api/bills - Get bills`);
  console.log(`   GET /api/dashboard/stats - Dashboard statistics`);
  console.log(`\n🔧 Database Status: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});
