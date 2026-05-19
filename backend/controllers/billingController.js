const { mysql } = require("../config/database.js");
require("dotenv/config");
const WhatsAppService = require("../services/whatsappService.js");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "medical_system",
});

const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
};

// Generate Bill Receipt
exports.generateBillReceipt = async (req, res) => {
  try {
    const { patientName, patientPhone, items, discount, tax, paymentMethod } =
      req.body;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * (tax / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Generate bill number
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const billDate = new Date().toISOString().split("T")[0];

    // Create bill data object
    const billData = {
      billNumber,
      date: billDate,
      patientName,
      patientPhone,
      items: items.map((item) => ({
        medicineName: item.medicineName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
    };

    res.status(200).json({
      success: true,
      data: billData,
      message: "Bill receipt generated successfully",
    });
  } catch (error) {
    console.error("Generate bill receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate bill receipt",
      error: error.message,
    });
  }
};

// Send Bill via WhatsApp
exports.sendBillViaWhatsApp = async (req, res) => {
  try {
    const { billId, patientPhone } = req.body;

    // In a real implementation, you would fetch bill from database
    // For now, we'll use the bill data from the request
    const billData = req.body.billData;

    if (!billData || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: "Bill data and patient phone are required",
      });
    }

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService();

    // Send bill receipt via WhatsApp
    const result = await whatsappService.sendBillReceipt(
      billData,
      patientPhone,
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          messageId: result.messageId,
          phoneNumber: result.phoneNumber,
          billNumber: billData.billNumber,
        },
        message: "Bill sent successfully via WhatsApp",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send bill via WhatsApp",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Send bill via WhatsApp error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send bill via WhatsApp",
      error: error.message,
    });
  }
};

// Send Bill via Email (alternative)
exports.sendBillViaEmail = async (req, res) => {
  try {
    const { billId, patientEmail, billData } = req.body;

    if (!billData || !patientEmail) {
      return res.status(400).json({
        success: false,
        message: "Bill data and patient email are required",
      });
    }

    // In a real implementation, you would use a service like SendGrid or Nodemailer
    const emailContent = `
      <h2>MediCare Bill Receipt</h2>
      <p>Bill Number: ${billData.billNumber}</p>
      <p>Date: ${billData.date}</p>
      <p>Patient: ${billData.patientName}</p>
      <p>Total Amount: ₹${billData.totalAmount.toFixed(2)}</p>
      <p>Payment Method: ${billData.paymentMethod}</p>
    `;

    console.log("Email bill content generated:", emailContent);

    res.status(200).json({
      success: true,
      data: {
        email: patientEmail,
        billNumber: billData.billNumber,
      },
      message:
        "Bill email content generated (email service integration needed)",
    });
  } catch (error) {
    console.error("Send bill via email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate email bill",
      error: error.message,
    });
  }
};

// Get Bill History
exports.getBillHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      patientPhone,
      startDate,
      endDate,
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const offset = (safePage - 1) * safeLimit;

    const where = [];
    const params = [];

    if (patientPhone) {
      where.push("p.phone LIKE ?");
      params.push(`%${patientPhone}%`);
    }

    // startDate/endDate expected as YYYY-MM-DD
    if (startDate) {
      where.push("DATE(b.created_at) >= ?");
      params.push(startDate);
    }

    if (endDate) {
      where.push("DATE(b.created_at) <= ?");
      params.push(endDate);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countRows = await query(
      `SELECT COUNT(*) as total
       FROM bills b
       INNER JOIN patients p ON p.id = b.patient_id
       ${whereSql}`,
      params,
    );

    const total = countRows?.[0]?.total || 0;

    const bills = await query(
      `SELECT
         b.id,
         b.bill_number as billNumber,
         DATE(b.created_at) as date,
         p.name as patientName,
         p.phone as patientPhone,
         b.total_amount as totalAmount,
         b.payment_method as paymentMethod,
         b.status as status
       FROM bills b
       INNER JOIN patients p ON p.id = b.patient_id
       ${whereSql}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
    );

    res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Get bill history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bill history",
      error: error.message,
    });
  }
};
