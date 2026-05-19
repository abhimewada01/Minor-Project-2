const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to billing routes
router.use(authenticateToken);

// POST /api/billing/generate-receipt - Generate bill receipt
router.post('/generate-receipt', billingController.generateBillReceipt);

// POST /api/billing/send-whatsapp - Send bill via WhatsApp
router.post('/send-whatsapp', billingController.sendBillViaWhatsApp);

// POST /api/billing/send-email - Send bill via email
router.post('/send-email', billingController.sendBillViaEmail);

// GET /api/billing/history - Get bill history
router.get('/history', billingController.getBillHistory);

module.exports = router;
z