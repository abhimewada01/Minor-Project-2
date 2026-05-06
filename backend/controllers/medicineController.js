import { Medicine } from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';

// Currency conversion function
const convertToINR = async (usdAmount) => {
  try {
    const response = await axios.get(`${process.env.CURRENCY_API_URL}`, {
      headers: {
        'apikey': process.env.CURRENCY_API_KEY
      }
    });
    
    const rate = response.data.rates.INR || 83; // Fallback rate
    return parseFloat((usdAmount * rate).toFixed(2));
  } catch (error) {
    console.error('Currency conversion failed:', error.message);
    return parseFloat((usdAmount * 83).toFixed(2)); // Fallback to fixed rate
  }
};

// Create Medicine
export const createMedicine = async (req, res) => {
  try {
    const { name, category, stock, min_stock, price_usd, expiry_date, supplier } = req.body;
    
    // Convert USD to INR
    const price_inr = await convertToINR(price_usd);
    
    const medicine = await Medicine.create({
      name,
      category,
      stock: parseInt(stock),
      min_stock: parseInt(min_stock),
      price_usd: parseFloat(price_usd),
      price_inr,
      expiry_date,
      supplier
    });
    
    res.status(201).json({
      success: true,
      data: medicine,
      message: 'Medicine created successfully'
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: error.message
    });
  }
};

// Get All Medicines
export const getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`
      };
    }
    
    const { count, rows: medicines } = await Medicine.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message
    });
  }
};

// Get Medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findByPk(id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine',
      error: error.message
    });
  }
};

// Update Medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const medicine = await Medicine.findByPk(id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    // Convert USD to INR if price_usd is being updated
    if (updates.price_usd) {
      updates.price_inr = await convertToINR(updates.price_usd);
    }
    
    await medicine.update(updates);
    
    res.status(200).json({
      success: true,
      data: medicine,
      message: 'Medicine updated successfully'
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

// Delete Medicine
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findByPk(id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    await medicine.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine',
      error: error.message
    });
  }
};

// Get Low Stock Medicines
export const getLowStockMedicines = async (req, res) => {
  try {
    const lowStockMedicines = await Medicine.findAll({
      where: {
        stock: {
          [Op.lt]: sequelize.col('min_stock')
        }
      },
      order: [['stock', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: lowStockMedicines,
      count: lowStockMedicines.length
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock medicines',
      error: error.message
    });
  }
};

// Get Expiring Soon Medicines
export const getExpiringSoonMedicines = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringMedicines = await Medicine.findAll({
      where: {
        expiry_date: {
          [Op.lte]: thirtyDaysFromNow
        }
      },
      order: [['expiry_date', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: expiringMedicines,
      count: expiringMedicines.length
    });
  } catch (error) {
    console.error('Get expiring medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring medicines',
      error: error.message
    });
  }
};
