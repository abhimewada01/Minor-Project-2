import express from 'express';
import { 
  getAllMedicines, 
  getMedicineById, 
  createMedicine, 
  updateMedicine, 
  deleteMedicine, 
  getLowStockMedicines, 
  getExpiringSoonMedicines 
} from '../controllers/medicineController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/medicines - Get all medicines with pagination and search
router.get('/', getAllMedicines);

// GET /api/medicines/:id - Get medicine by ID
router.get('/:id', getMedicineById);

// POST /api/medicines - Create new medicine
router.post('/', createMedicine);

// PUT /api/medicines/:id - Update medicine
router.put('/:id', updateMedicine);

// DELETE /api/medicines/:id - Delete medicine
router.delete('/:id', deleteMedicine);

// GET /api/medicines/low-stock - Get low stock medicines
router.get('/low-stock', getLowStockMedicines);

// GET /api/medicines/expiring-soon - Get expiring medicines
router.get('/expiring-soon', getExpiringSoonMedicines);

export default router;
